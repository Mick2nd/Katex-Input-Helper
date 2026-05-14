import { Buffer } from 'buffer';
import { openDB, deleteDB } from 'idb';
import { ParametersDb } from './db.mjs';
import { Schema, CommonType, LayoutType, ConfigType } from './schema.mjs';


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
		const descriptor = Object.getOwnPropertyDescriptor(o, prop);
		if (descriptor) {
			const result = descriptor?.get !== undefined;
			return result;
		}

		const result = o.__lookupGetter__(prop) !== undefined;				// fallback method working only at the moment
		return result;
	}

	function hasSetter(o: any, prop: string) : boolean {
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
	get equation(): string;
	set equation(value: string);
	get displayMode() : boolean;
	get isMobile() : boolean;
	set migrated(value: boolean);
}

/**
 * The Web client.
 */
class WebClient implements IClient {
	_schema: Schema = null;
	_configuration: any;
	_equation: string = "";
	mode = "web";

	/**
	 * Constructor.
	 */	
	constructor(schema: Schema, configuration: any) {
		document.cookie = "mjx.menu=";
		this._schema = schema;
		this._configuration = configuration;
	}
	
	async init(migrated: boolean) {
		const response = this.loadCookies([ 'equation' ]);
		if (response['equation']) {
			this._equation = response['equation'];
		}
	}
	
	async get(keys: string[]) {
		const response = this.loadCookies(keys);
		return response;
	}
	
	get equation(): string {
	    return this._equation;
	}
	
	set equation(value: string) {
		this._equation = value;
		this.storeCookie("equation", value);
	}
	
	get displayMode(): boolean {
		
		const searchParams = new URLSearchParams(window.location.search);
		if (searchParams.has('displayMode')) {
			return searchParams.get('displayMode') === 'true';
		}
		return true;
	}
	
	get isMobile(): boolean {
		
		const searchParams = new URLSearchParams(window.location.search);
		if (searchParams.has('mobile')) {
			return searchParams.get('mobile') === 'true';
		}
		return false;	    
	}
	
	set migrated(value: boolean) {
	    
	}

	/**
	 * Store a single cookie after checking if it's desired.
	 * 
	 * @param key - key, e.g. name of the item to be stored
	 * @param val - value to be stored
	 */
	storeCookie(key: string, val: any) {
		if (!globalThis.localStorage) { return; }
		
		const persistEquations = this._configuration.persistEquations === true
		const persistWindowPositions = this._configuration.persistWindowPositions === true;
		
		if (this.shouldBeStored(key, persistEquations, persistWindowPositions)) {
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
				alert(`alert : ${json} : ${e}`);
				globalThis.localStorage.removeItem(key);
			}
		} else {
			globalThis.localStorage.removeItem(key);
		}
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
			return inst._schema.defaultOf(key) ?? '';
		}
		function fromHex(key: string, val: string) : string {
			try {
				return Buffer.from(val, 'hex').toString('utf-8');
			} catch(e) { 
				console.warn(`Hex Cookie conversion error : ${key} : ${e}`);
				return val;
			}
		}
		
		// TODO: delete?
		if (!globalThis.localStorage) { return { equation: '' }; }
		try {
			const cookies = { };

			const persistEquations = globalThis.localStorage.getItem('persistEquations') !== 'false';
			const persistWindowPositions = globalThis.localStorage.getItem('persistWindowPositions') !== 'false';
			
			for (const key of keys) {
				if (this.shouldBeStored(key, persistEquations, persistWindowPositions)) {
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
			}		
			return cookies;
			
		} catch(e) {
			const msg = `Cookies inconsistent : ${e}`;
			console.warn(msg);
			return this.resetCookies();
		}
	}

	/**
	 * Resets the cookies if they are in an inconsistent or fresh state.
	 */
	resetCookies() {
		for (const [ key, val ] of Object.entries(this._configuration)) {
			this.storeCookie(key, val);
		}
		return this._configuration;
	}

	/**
	 * Checks for a single key if its data item should be stored as Cookie.
	 * 
	 * @param key - the key to be checked
	 * @param [persistEquations=true] - setting for equationCollection
	 * @param [persistWindowPositions=true] - setting for window positions
	 */
	shouldBeStored(key: string, persistEquations = true, persistWindowPositions = true) {
		return (
			(key === 'equation' ||
			 this._schema.isCommonKey(key) || 
			 (persistWindowPositions && this._schema.isWindowKey(key)) ||
		 	 (persistEquations && this._schema.isEquationsKey(key))));
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
	
	mode = "plugin";
	
	constructor(private readonly schema: Schema) {
		
	}

	private async create() {
		const msg = {
			id: this.id,
			cmd: 'CREATE',
			data: this.schema.defaults
		};
		await window.webviewApi.postMessage(msg);			
	}

	/**
	 * Initialization.
	 */	
	async init(migrated: boolean) {
		
		const keys = [ 'equation', 'displayMode', 'isMobile' ];
		const response = await this.get(keys);
		if (response) {
			this._equation = response.equation ?? "";
			this._displayMode = response.displayMode === true;
			this._isMobile = response.isMobile === true;
			
			if (!migrated) {
				await this.create();
			}
		
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
		const response = await window.webviewApi.postMessage(msg);
		return response;
	}
	

	get equation(): string {
	    return this._equation;
	}

	set equation(value: string) {
		this._equation = value;
		this.write();
	}

	get displayMode(): boolean {
	    return this._displayMode;
	}

	get isMobile(): boolean {
		return this._isMobile;
	}

	set migrated(value: boolean) {
		this._migrated = value;
		
		const msg = {
			id: this.id,
			cmd: 'WRITE',
			data: [ 'migrated', value ]
		};
		window.webviewApi.postMessage(msg).then(() => { });

		if (!value) {
			console.warn(`Migration to database store failed, data may be lost`);
		}
	}
	
	write() {
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
	db: ParametersDb = null;
	schema: Schema = null;
	capabilities: Capabilities = null;
	configuration: any = { };	
	
	suppressWriteBack = false;
	
	/**
	 * Constructor.
	 */
	constructor() {
		
		this.schema = new Schema();
		this.db = new ParametersDb(this.schema);							// instantiate the db
		this.capabilities = new Capabilities();
		
		if (this.capabilities.isPlugin) {									// configure the "Client" - side interface
			this.client = new PluginClient(this.schema);
		} else {
			this.client = new WebClient(this.schema, this.configuration);
		}
	}
	
	/**
	 * Queries the parameters from the Plugin. They are persisted there as settings.
	 * In the web variant they are stored as Cookies.
	 */
	async queryParameters(migrated: boolean = false) {
			
		await this.client.init(migrated);
		if (migrated) { return { }; }	

		let all = { };
		for (const [ , key ] of this.schema.configurationKeys) {
			const response = await this.client.get([ key ]);
			if (response) {
				this[key] = response[key];
				if (this.schema.isWindowKey(key)) {
					this.resizePanel(key);
				}
				
				all = $.extend(all, response);
			} else {
				console.warn(`The "Katex Input Helper" plugin did not return a response to get parameters `);				
			}
		}
		return all;
	}
	
	/**
	 * Queries the parameters from the database. For the migration of old style 
	 * storage to db parameters must be transferred.
	 */
	async queryParametersDb() {
		try {
			await this.db.open();												// also call upgrade

			const migrated = await this.db.getCommon('migrated', false);		// entry may not exist - defaults to false
			this.client.migrated = migrated;
			const response = await this.queryParameters(migrated);				// old style parameters or rest of them
			
			if (!migrated) {
				if (response) {
					console.info(`About to migrate parameter representation`);
					for (const [key, val] of Object.entries(response)) {		// this transfers them to the db
						if (this.schema.isConfigurationKey(key)) {
							await this.db.putParameter(key, val);				// TODO: Is this doubled functionality?
						}
					}

					await this.db.putCommon('migrated', true);					// for the next invocation
					this.client.migrated = true;
				}
			}

			this.suppressWriteBack = true;										// initial read does not permit write back
			for (const [ store, key ] of this.schema.configurationKeys) {	// in either case read parameters from the db
				const value = await this.db.get(store, key);
				this[key] = value;
			}
			this.suppressWriteBack = false;

		} catch(error) {
			console.error('Could not query parameters from DB: %s', error);
			this.suppressWriteBack = false;
		}
	}
	
	/**
	 * Wrapper. Delegates to db.
	 */
	enqueueParameter(prop: string, value: any) {
		if (this.db === null) { return; }
		this.db.enqueueParameter(prop,  value);
	}

	/**
	 * Resets all window positions. Defaults will be activated.
	 * 
	 * The defaults are determined, when panel is first displayed after re-start.
	 */	
	resetWindowPositions() {
		for (const [ key, val ] of Object.entries(this.configuration)) {
			if (this.schema.isWindowKey(key)) {
				Layout.revert(val, true);					// force revert to initial settings
				this.resizePanel(key);
				this.enqueueParameter(key, val);			// changes must be written to db
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
 */
class Capabilities {
	
	get isPlugin() : boolean {
		return window.webviewApi !== undefined;
	}
	
	get isLocalStorageEnabled() : boolean {
		try {
			const key = `__storage__test`;
			window.localStorage.setItem(key, null);
			window.localStorage.removeItem(key);
			return true;
		
		} catch (e) {
			return false;
		}
	}
	
	async isIndexedDbEnabled() : Promise<boolean> {
		try {
			const dbName = `__db__test`;
			const db = await openDB(dbName, 1, {
				upgrade(...params) { }
			});
			await deleteDB(dbName);
			return true;
			
		} catch(e) {
			return false;
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
