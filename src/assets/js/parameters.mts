import { Buffer } from 'buffer';
import { openDB, deleteDB } from 'idb';
import { ParametersDb } from './db.mjs';
import { Schema, ConfigType } from './schema.mjs';


/**
 * Factory method generating a Proxy for KIHParameters. The proxy has a *set* trap
 * to intercept write actions to the class. This writes settings either to the *idb*
 * database, as cookies or prepares back-transfer to the plugin.
 * 
 * The **idb** database is a new store. To prevent data loss, the data must be migrated
 * to this new store. Features must exist in parallel to support this.
 */
export function ParametersProxy() {
	const parameters = new KIHParameters();
	
	function hasGetter(o: any, prop: string) : boolean {
		if (typeof o !== 'object' || o === null || o === undefined) {
			return false;
		}
		const descriptor = Object.getOwnPropertyDescriptor(o, prop);
		if (descriptor) {
			const result = descriptor?.get !== undefined;
			return result;
		}

		const result = o.__lookupGetter__(prop) !== undefined;				// fallback method working only at the moment
		return result;
	}

	function hasSetter(o: any, prop: string) : boolean {
		if (typeof o !== 'object' || o === null || o === undefined) {
			return false;
		}
		const descriptor = Object.getOwnPropertyDescriptor(o, prop);
		if (descriptor) {
			const result = descriptor?.set !== undefined;
			return result;
		}
		
		const result = o.__lookupSetter__(prop) !== undefined;
		return result;
	}

	return new Proxy(
		parameters,
		{
			/**
			 * The **set** trap. Invoked by the Proxy when properties are set.
			 */
			set(target: KIHParameters, prop: string, value: any, receiver: any) {
				
				if (hasSetter(target.client, prop)) {
					target.client[prop] = value;
					return true;
				}
				
				if (target.schema.isConfigurationKey(prop)) {				
					const changed = !isEqual(target.configuration[prop], value); 	// lodash
					if (changed) {
						target.configuration[prop] = value;						
						if (!target.suppressWriteBack) {					// write back must be suppressed during initial load
							target.db.enqueueParameter(prop, value);					
						}
					}
					return true;
				}
				
				Reflect.set(target, prop, value, receiver);
				return true;
			},
			
			/**
			 * The **get** trap.
			 */
			get(target: any, prop: string, receiver: any) : any {
				
				if (hasGetter(target.client, prop)) {
					return target.client[prop];
				}
				if (target.schema.isConfigurationKey(prop)) {
					return target.configuration[prop];
				}
				
				return Reflect.get(target, prop, receiver);
			}
		});
}

/**
 * A factory method to generate proxies for the individual configuration settings.
 * Each config value is stored as object, simple data types are boxed. This proxy
 * can do:
 * - maintain 2 versions of the config: original and current
 * - update from changed value
 * - query current value and changes
 * - initiate signals from changed values
 * - detect changes inside composite types
 */
function ConfigProxy(key: string, config: ConfigType, cb: (key, config) => { }) {
	
	function box(config: ConfigType) : any {
		if (typeof config === 'object') {
			return config;
		}
		if (config === undefined) {
			return { };
		}
		return { value: config };
	}
	function unbox(config: any) : ConfigType {
		if (config.hasOwnProperty('value')) {
			return config['value'];
		}
		return config;
	}
	function isBoxed(config: any) : boolean {
		return config.hasOwnProperty('value');
	}
	
	const original = box(config);
	const current = $.extend({ }, original);
	return new Proxy({
			original: original,
			current: current
		}, 
		{	
			set(target: any, prop: string, value: any, receiver: any) {
				
				const original = target.original;
				let current = target.current;
				
				if (prop === 'config') {
					current = box(value);
					target.current = current;
				} else {
					current[prop] = value;
				}
				if (!isEqual(original, current)) {
					cb(key, unbox(current));
				}

				// Reflect.set(target, prop, value, receiver);
				return true;			
			},
			get(target: any, prop: string, receiver: any) : any {

				const original = target.original;
				const current = target.current;
				if (prop === 'hasChanged') {
					return !isEqual(original, current);
				}
				if (prop === 'config') {
					return unbox(current);
				}
				return current[prop]; 	// Reflect.get(target, prop, receiver);				
			}
		});
}

/**
 * The storage sink interface: writes a single value.
 */
interface IStorageSink {
	write(key: string, value?: any) : void;
}

/**
 * Abstract base class: provides the *shouldBeStored* function.
 */
abstract class StorageSinkBase implements IStorageSink {
	queue = [];
	ongoingPut = false;
	
	/**
	 * Constructor.
	 */
	constructor(protected readonly schema: Schema, protected readonly configuration: any) {
		
	}
	
	/**
	 * Write method.
	 */
	public write(key: string, value?: any) : void {
		if (this.shouldBeStored(key)) {
			const val = (value ?? this.configuration[key]);
			this.enqueue(key, val);
		}
	}
	
	/**
	 * Abstract Put method, implemented in derived classes.
	 */
	abstract put(key: string, value: any) : Promise<void>;

	/**
	 * Enqueues a single property to the property queue.
	 */
	protected enqueue(prop: string, value: any) {
		this.queue.push([ prop, value ]);
		if (!this.ongoingPut) {
			this.ongoingPut = true;
			this.startDequeue();
		}
	}

	/**
	 * Private *put queue* processing.
	 */
	private startDequeue() {
		const [ prop, value ] = this.queue.shift(); 
		this.put(prop, value)
		.then(() => {
			if (this.queue.length > 0) {
				this.startDequeue();
			} else {
				this.ongoingPut = false;
			}
		})
		.catch((err) => {
			console.error(`Error during dequeue of ${prop} : %s`, err);
		});
	}
	
	/**
	 * Returns whether the selected setting should be stored.
	 */
	protected shouldBeStored(key: string) {
		return (
			key == 'equation' ||
			this.schema.isCommonKey(key) || 
			(this.configuration.persistWindowPositions && this.schema.isWindowKey(key)) ||
		 	(this.configuration.persistEquations && this.schema.isEquationsKey(key)));
	}
}

/**
 * The plugin storage sink.
 */
class PluginSink extends StorageSinkBase {
	id = "Katex Input Helper";
	
	/**
	 * Puts single setting into the sink.
	 */
	async put(key: string, value: any) : Promise<void> {
		const msg = {
			id: this.id,
			cmd: 'WRITE',
			data: [ key, value ]
		};
		await globalThis.webviewApi.postMessage(msg);			
	}
}

/**
 * The Web storage sink.
 */
class WebSink extends StorageSinkBase {
	
	/**
	 * Puts single setting into the sink.
	 */
	async put(key: string, value: any) : Promise<void> {
		this.storeCookie(key, value);			
	}
	
	/**
	 * Store a single cookie after checking if it's desired.
	 * TODO: error & exception handling.
	 * 
	 * @param key - key, e.g. name of the item to be stored
	 * @param val - value to be stored
	 */
	storeCookie(key: string, val: any) {
		if (!globalThis.localStorage) { return; }
		
		if (this.shouldBeStored(key)) {
			let json = null;
			if (!val) {
				console.warn(`storeCookie error for key ${key}, no value`);
				return;
			}
			try {
				json = JSON.stringify(val);
				let final = json;
				if (key == 'equation' || key == 'equationCollection') {				
					final = Buffer.from(json, 'utf8').toString('hex');
				}
				globalThis.localStorage.setItem(key, final);
				
			} catch(e) {
				console.warn(`Cookie store error : ${json} : ${e}`);
				globalThis.localStorage.removeItem(key);
			}
		} else {
			globalThis.localStorage.removeItem(key);
		}
	}

	/**
	 * Resets the cookies if they are in an inconsistent or fresh state.
	 */
	resetCookies() {
		for (const [ key, val ] of Object.entries(this.configuration)) {
			this.storeCookie(key, val);
		}
		return this.configuration;
	}

}

/**
 * The db storage sink.
 */
class DbSink extends StorageSinkBase {

	/**
	 * Constructor.
	 */	
	constructor(schema: Schema, configuration: any, private readonly db: ParametersDb, private readonly isPlugin: boolean = true) {
		super(schema, configuration);
	}
	
	/**
	 * Puts single setting into the sink.
	 */
	async put(key: string, value: any) : Promise<void> {
		if (key == 'equation') {
			if (!this.isPlugin) {
				await this.db.put('customEquationsStore', key, value);
			}
			return;
		}
		await this.db.putParameter(key, value);			// put needs store parameter		
	}
}

/**
 * The storage source interface: Initializes the storage source.
 */
interface IStorageSource {
	configuration: any;
	init() : Promise<void>;
}

/**
 * The Plugin storage source.
 */
class PluginSource implements IStorageSource {
	id = "Katex Input Helper";
	
	/**
	 * Constructor.
	 */
	constructor(private readonly schema: Schema, public readonly configuration: any) {
		
	}
	
	/**
	 * Init method. Sends register requests and queries the configuration settings.
	 */
	async init() : Promise<void> {
		function filter(o: any) : any {
			return Object.fromEntries(Object.entries(o).filter(([ , val ]) => val !== undefined));
		}
		
		await this.create();
		const keys: string[] = [ ...this.schema.configurationKeys ].map(([ , key ]: [string, string]) => key);
		const response = filter(await this.get(keys));
		$.extend(this.configuration, response);
		
		console.debug(`${JSON.stringify(response)}`);
	}

	/**
	 * Sends a create request to the plugin.
	 */
	private async create() {
		const msg = {
			id: this.id,
			cmd: 'CREATE',
			data: this.schema.defaults
		};
		await globalThis.webviewApi.postMessage(msg);			
	}
	
	/**
	 * Sends a get request to the plugin, returning available settings.
	 */
	private async get(keys: string[]) {
		const msg = {
			id: this.id,
			cmd: 'READ',
			data: keys
		};
		const response = await globalThis.webviewApi.postMessage(msg);
		return response;
	}
	
}

/**
 * The Web storage source: implemented by *localStorage*.
 */
class WebSource implements IStorageSource {

	/**
	 * Constructor
	 */
	constructor(private readonly schema: Schema, public readonly configuration: any) {
		
	}
	
	/**
	 * Init method loads configuration settings and the equation from Cookies.
	 */
	async init() : Promise<void> {
		
		const keys = [ ...this.schema.configurationKeys ].map(([ , key ]) => key);
		const response = this.loadCookies(keys);
		const equation = this.loadCookies([ 'equation' ]);
		$.extend(this.configuration, response, equation);
	}
	
	/**
	 * Loads selected cookies. Cookies must be defined and must not be deactivated.
	 */
	loadCookies(keys: string[]) {
		const inst = this;
		
		function isInvalid(val: any) {
			return val === undefined || val === null || val === 'null';
		}
		function defaultOf(key: string) {
			return inst.schema.defaultOf(key) ?? '';
		}
		function fromHex(key: string, val: string) : string {
			try {
				return Buffer.from(val, 'hex').toString('utf-8');
			} catch(e) { 
				console.warn(`Hex Cookie conversion error : ${key} : ${e}`);
				return val;
			}
		}
		
		try {
			const cookies = { };

			for (const key of keys) {
				let val = globalThis.localStorage.getItem(key);
				if (isInvalid(val) || val === '') {
					cookies[key] = defaultOf(key);
					continue; 
				}
				if (key == 'equation' || key == 'equationCollection') {
					val = fromHex(key, val);
				}
				val = JSON.parse(val); 
				cookies[key] = val;
			}		
			return cookies;
			
		} catch(e) {
			const msg = `Cookies inconsistent : ${e}`;
			console.warn(msg);
			return { };
		}
	}

}

/**
 * The Db storage source: implemented by *IndexedDB*.
 */
class DbSource implements IStorageSource {

	/**
	 * Constructor.
	 */
	constructor(private readonly schema: Schema, public readonly configuration: any, private readonly db: ParametersDb, private readonly isPlugin: boolean = true) {
		
	}

	/**
	 * The init method loads the configuration settings and, in case of Web variant, the current 
	 * equation from IndexedDB.
	 */
	async init() : Promise<void> {
		
		for (const [ store, key ] of this.schema.configurationKeys) {
			const config = await this.db.get(store, key);
			this.configuration[key] = config;
		}
		
		if (!this.isPlugin) {
			this.configuration['equation'] = (await this.db.get('customEquationsStore', 'equation')) ?? '';
		}
	}
}

/**
 * Interface for communication between client and Katex Input Helper.
 * 
 * Design decision: 
 * - all communication between client and Katex Input Helper is reduced in the
 *   back direction.
 * - remaining interface snippets may be truncated.
 * - this only matters if the migration fails to succeed.
 */
interface IClient {
	init(migrated: boolean) : Promise<void>;
	get(keys: string[]) : Promise<any>;
	
	mode: string;
	sink: IStorageSink;
	get equation(): string;
	set equation(value: string);
	get displayMode() : boolean;
	get isMobile() : boolean;
	get severity() : number;
	set migrated(value: boolean);
}

/**
 * The Web client.
 */
class WebClient implements IClient {
	_equation: string = "";
	mode = "web";

	/**
	 * Constructor.
	 */	
	constructor(private readonly source: IStorageSource, public readonly sink: IStorageSink) {
		document.cookie = "mjx.menu=";
	}
	
	async init(migrated: boolean) {
		await this.source.init();								// loads whole configuration inclusive equation
		
		const equation = this.source.configuration['equation'];
		if (equation) {
			this._equation = equation;
		}
	}
	
	async get(keys: string[]) {
		const response = { }; 			// Probably no longer required: this.loadCookies(keys);
		return response;
	}
	
	get equation(): string {
	    return this._equation;
	}
	
	set equation(value: string) {
		this._equation = value;
		this.sink.write("equation", value);
	}
	
	get displayMode(): boolean {
		
		const searchParams = new URLSearchParams(globalThis.location.search);
		if (searchParams.has('displayMode')) {
			return searchParams.get('displayMode') === 'true';
		}
		return true;
	}
	
	get isMobile(): boolean {
		
		const searchParams = new URLSearchParams(globalThis.location.search);
		if (searchParams.has('mobile')) {
			return searchParams.get('mobile') === 'true';
		}
		return false;	    
	}

	get severity(): number {
		
		const searchParams = new URLSearchParams(globalThis.location.search);
		if (searchParams.has('severity')) {
			return Number(searchParams.get('severity'));
		}
		return 1;	    
	}
	
	set migrated(value: boolean) {
	    
	}
}

/**
 * The **Plugin** client.
 */
class PluginClient implements IClient {
	id = "Katex Input Helper";
	_equation: string = "";
	_displayMode: boolean = true;
	_isMobile: boolean = false;
	_migrated: boolean = false;
	_severity: number = 1;
	_profile = "";
	
	mode = "plugin";
	
	/**
	 * Constructor.
	 */
	constructor(private readonly source: IStorageSource, public readonly sink: IStorageSink) {
		
	}

	/**
	 * Initialization.
	 */	
	async init(migrated: boolean) {
		
		const keys = [ 'equation', 'displayMode', 'isMobile', 'severity', 'profile' ];
		const response = await this.get(keys);
		if (response) {
			this._equation = response.equation ?? "";
			this._displayMode = response.displayMode === true;
			this._isMobile = response.isMobile === true;
			this._severity = response.severity;
			this._profile = response.profile;
			
			await this.source.init();
		
		} else {
			console.warn(`The "Katex Input Helper" plugin did not return a response to get parameters `);
		}
	}
	
	/**
	 * Queries initial settings or configuration settings.
	 */
	async get(keys: string[]) {
		const msg = {
			id: this.id,
			cmd: 'READ',
			data: keys
		};
		const response = await globalThis.webviewApi.postMessage(msg);
		return response;
	}
	

	get equation(): string {
	    return this._equation;
	}

	set equation(value: string) {
		this._equation = value;
		this.writeResult();
	}

	get displayMode(): boolean {
	    return this._displayMode;
	}

	get isMobile(): boolean {
		return this._isMobile;
	}

	get severity(): number {
		return this._severity;
	}

	get profile(): number {
		return this._profile;
	}

	set migrated(value: boolean) {
		this._migrated = value;
		this.sink.write('migrated', value);				// migrated must be listed in configuration (see sink)
		if (!value) {
			console.warn(`Migration to database store failed, data may be lost`);
		}
	}
	
	/**
	 * Equation is written back to the plugin.
	 */
	private writeResult() {
		const dialogResponse = {
			equation: this.equation,
			migrated: this._migrated
		}
		$('#hidden').attr('value', JSON.stringify(dialogResponse));
	}
}


/**
 * Manages control parameters, especially those which can be stored over sessions.
 * It is based on the communication of messages to gain the settings of the plugin.
 */
export class KIHParameters {
	
	id = 'Katex Input Helper';

	client: IClient = null;
	readonly db: ParametersDb;
	readonly schema: Schema;
	readonly capabilities: Capabilities;
	readonly configuration: any;	
	
	suppressWriteBack = false;
	
	/**
	 * Constructor.
	 */
	constructor() {
		
		this.schema = new Schema();
		this.configuration = this.schema.defaults;
		this.db = new ParametersDb(this.schema);							// instantiate the db
		this.capabilities = new Capabilities();
	}
	
	/**
	 * Queries the parameters from the *Storage Source*. 
	 * - in the Plugin they are persisted there as settings.
	 * - in the web variant they are stored as Cookies.
	 * - newest implementation is IndexedDB.
	 */
	async queryParametersNext() {
		
		try {
			this.client = await this.capabilities.createClient(this.schema, this.configuration, this.db);
			await this.client.init(false);										// reads all configuration and initial data
			if (this.capabilities.migrate) {									// is this the MIGRATION session
				for (const [ store, key ] of this.schema.configurationKeys) {	// in either case read parameters
					this.client.sink.write(key);								// => sink
				}
				this.client.migrated = true;									// used in next session to avoid double migration
			}
		} catch(error) {
			console.error('Could not query parameters from source: %s', error);
		}
	}
	
	/**
	 * Wrapper. Delegates to db.
	 */
	enqueueParameter(prop: string, value: any) {
		this.client.sink.write(prop, value);
	}

	/**
	 * Resets all window positions. Defaults will be activated.
	 * 
	 * The defaults are determined, when panel is first displayed after re-start.
	 */	
	resetWindowPositions() {
		for (const [ key, val ] of Object.entries(this.configuration)) {
			if (this.schema.isWindowKey(key)) {
				Layout.revert(val, true);							// force revert to initial settings
				this.resizePanel(key);
				this.enqueueParameter(key, val);					// changes must be written to db
			}
		}
	}
	
	/**
	 * Returns the window ids as array.
	 */
	get windowIds() {
		return this.schema.windowKeys;
	}
	
	/**
	 * Returns the windows selectors as one string.
	 */
	get windowSelectors() {
		return this.windowIds.map(key => `#${key}`).join(',');
	}
		
	/**
	 * onPanelMove handler for some dialogs and windows.
	 */
	onPanelMove(id: string, left: number|string, top: number|string, initial: boolean = false) {
		if (!(id in this.configuration || this[id] == undefined)) {
			this[id] = { };
		}
		
		let stateChanged = false;
		if (initial) {
			stateChanged = this[id].initialLeft != left || this[id].initialTop != top;
			this[id].initialLeft = left;
			this[id].initialTop = top;
		} else {
			stateChanged = this[id].left != left || this[id].top != top;
			this[id].left = left;
			this[id].top = top;
		}

		if (stateChanged) {
			this.enqueueParameter(id, this[id]);
		}
	}
	
	/**
	 * onPanelResize handler for some dialogs and windows.
	 * 
	 * A Resize can also change *left* and *top* values. That's why we must include 
	 * those into consideration and add them to the object.
	 * This only works, if left / top are updated during resize!!
	 * EXPERIENCE: resize with left change persisted although onPanelMove not detected
	 * 
	 * @param id - id of the panel
	 * @param width - the width established by the user
	 * @param height - the height established by the user
	 */
	onPanelResize(id: string, width: number|string, height: number|string, initial: boolean = false) {
		if (!(id in this.configuration) || this[id] == undefined) {
			this[id] = { };
		}

		let stateChanged = false;
		if (initial) {
			stateChanged = this[id].initialWidth != width || this[id].initialHeight != height;
			this[id].initialWidth = width;
			this[id].initialHeight = height;
		} else {
			stateChanged = this[id].width != width || this[id].height != height;
			this[id].width = width;
			this[id].height = height;
		}
		
		if (stateChanged) {
			this.enqueueParameter(id, this[id]);
		}
	}
	
	/**
	 * Resizes (and repositions) a given panel by using the 'configured' settings.
	 * 
	 * For repositioning after reset a restart is required.
	 * 
	 * @param id - the panel id as in HTML
	 */
	resizePanel(id: any) {
		if (!this.client.isMobile && id in this.configuration && this[id] != undefined) {
			try {
				let o = this[id];
				//
				// Solution: either position and / or dimension must be known
				//
				if ((o.left && o.top) || (o.width && o.height)) {
					// Reserved.
					// console.log(`${this.id} Panel at resizePanel: {${o.left}, ${o.top}}`);
					$(`#${id}`).panel('resize', o);
				} else {
					console.warn(`Missing data for panel ${id} : ${JSON.stringify(o)}`);
				}
			} catch(e) {
				console.error(`Exception resizing panel ${id} : %s`, e);
			}
		} else if (!this.client.isMobile) {
			console.warn(`Missing id in parameters : ${id}`);
		}
	}
	
	/**
	 * Selected console output of the attributes. This is diagnostic output and
	 * normally deactivated.
	 */
	debugPrint() {
		this.printEquation();
		this.printEquationCollection();
		this.printSettingsConfiguration();
		this.printWindowConfiguration();
	}

	/**
	 * Console output of the equation.
	 */
	printEquation() {
		console.debug(`Return-Parameter : ${JSON.stringify(this.client.equation)} `);
	}
	
	/**
	 * Console output of the Custom Equations.
	 */
	printEquationCollection() {
		console.debug(`Equations-Parameter : ${JSON.stringify(this.configuration.equationCollection)} `);
	}
	
	/**
	 * Console output of the settings.
	 */
	printSettingsConfiguration() {
		for (const key of this.schema.commonKeys) {
			console.debug(`Settings-Parameters : ${key} : ${this.configuration[key]} `);
		}
	}

	/**
	 * Console output of the Window Size and Position.
	 */
	printWindowConfiguration() {
		for (const key of this.schema.windowKeys) {
			console.debug(`Window-Parameters : ${key} : ${JSON.stringify(this.configuration[key])} `);
		}
	}
}


/**
 * Design of helpers for window or panel dimensions.
 */

namespace Layout {
	
	export function revert(layout: any, force: boolean = false) {
		
		if (layout.initialLeft && (force || !layout.left)) {
			layout.left = layout.initialLeft;
		}
		if (layout.initialTop && (force || !layout.top)) {
			layout.top = layout.initialTop;
		}
		if (layout.initialWidth && (force || !layout.width)) {
			layout.width = layout.initialWidth;
		}
		if (layout.initialHeight && (force || !layout.height)) {
			layout.height = layout.initialHeight;
		}
	
		return this;
	}
}

/**
 * Used to query capabilities of a running instance:
 * - is this a plugin
 * - is local storage enabled
 * - is indexed db enabled
 * 
 * This is also the place, where knowledge is used to create an IClient instance.
 */
class Capabilities {
	migrate: boolean = false;
	
	/**
	 * Checks if running instance is a plugin.
	 */
	get isPlugin() : boolean {
		return globalThis.webviewApi !== undefined;
	}
	
	/**
	 * Checks if LocalStorage (Cookies) is enabled.
	 */
	get isLocalStorageEnabled() : boolean {
		try {
			const key = `__storage__test`;
			globalThis.localStorage.setItem(key, null);
			globalThis.localStorage.removeItem(key);
			return true;
		
		} catch (e) {
			return false;
		}
	}
	
	/**
	 * Checks if IndexedDB is enabled. It does this by creating a TEST database.
	 */
	async isIndexedDbEnabled() : Promise<boolean> {
		try {
			// TEST
			// return false;
			const dbName = `__db__test`;
			await openDB(dbName, 1, {
				upgrade(db, _oldVersion, _newVersion, transaction, _event) { 
					db.createObjectStore('xxx');
					transaction.done.then(() => {
					}); 
				}
			});
			deleteDB(dbName).then(() => {});
			return true;
			
		} catch(e) {
			return false;
		}
	}
	
	/**
	 * Creates an **IClient** instance. This can be a Web or a Plugin client.
	 * Both of them have a Sink and a Source instance both of which can be
	 * Plugin, IndexedDb or localStorage.
	 */
	async createClient(schema: Schema, configuration: any, db: ParametersDb) : Promise<IClient> {
		
		const dbAvailable = await this.isIndexedDbEnabled();
		if (dbAvailable) {
			await db.open();													// also creates ready to use db
		}
		const migrated = dbAvailable && (await db.getCommon('migrated', false));
		let source: IStorageSource = null;
		let sink: IStorageSink = null;

		if (this.isPlugin) {
			
			if (migrated) {
				source = new DbSource(schema, configuration, db);
				sink = new DbSink(schema, configuration, db);
			} else if (dbAvailable) {
				source = new PluginSource(schema, configuration);
				sink = new DbSink(schema, configuration, db);
				this.migrate = true;
			} else {
				source = new PluginSource(schema, configuration);
				sink = new PluginSink(schema, configuration);
			}
			const client: IClient = new PluginClient(source, sink);
			return client;
			
		} else {
			
			if (migrated) {
				source = new DbSource(schema, configuration, db, false);
				sink = new DbSink(schema, configuration, db, false);
			} else if (dbAvailable) {
				source = new WebSource(schema, configuration);
				sink = new DbSink(schema, configuration, db, false);
				this.migrate = true;
			} else {
				source = new WebSource(schema, configuration);
				sink = new WebSink(schema, configuration);
			}
			const client: IClient = new WebClient(source, sink);
			return client;
		}
	}
	
	async toString() {
		const enabled = await this.isIndexedDbEnabled();
		return `Capabilities : ${this.isPlugin}, ${this.isLocalStorageEnabled}, ${enabled}`;
	}
}

// #region Transaction

/**
 * Supports transactions.
 * 
 * - normal mode: each desired action of the client initiates execution of a completion routine.
 * - transaction mode: after a series of desired actions the execution of a completion 
 *   routine is initiated.
 */
class Transaction {
	
	onComplete = null;
	onEnd = null;
	onCompleteBackup = null;
	onEmpty = null;
	
	/**
	 * Configures the instance by providing *Completion* and *End* routines.
	 */
	configure(onComplete: any, onEnd = onComplete) {
		this.onComplete = onComplete;
		this.onCompleteBackup = onComplete;
		this.onEnd = onEnd;
		this.onEmpty = (...args: any) => { };
	}
	
	/**
	 * Completes a single *Action* but not during a *Transaction*.
	 * 
	 * Executes the Completion routine, but not during a Transaction.
	 */
	complete(...args: any) {
		this.onComplete(...args);
	}
	
	/**
	 * Begins a *Transaction*. The completion routine is deactivated.
	 */
	begin() {
		this.onComplete = this.onEmpty;
	}
	
	/**
	 * Ends a *Transaction*.
	 * The *End* routine is executed, then the Completion routine is re-activated.
	 */
	end(...args: any) {
		this.onEnd(...args);
		this.onComplete = this.onCompleteBackup;
	}
	
	cancel() {
		this.onComplete = this.onCompleteBackup;
	}
	
	/**
	 * Checks and returns, if there is an ongoing Transaction.
	 */
	get isOngoingTransaction() {
		return this.onComplete === this.onEmpty;
	}
}

// #endregion

// This helps to import symbols in test suite
try {
	module.exports = { KIHParameters, ParametersProxy, Transaction };
} catch(e) { }
