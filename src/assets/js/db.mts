import { openDB, deleteDB, wrap, unwrap } from 'idb';


export interface IUpgradeDb {
	upgrade(db, oldVersion, newVersion, transaction, event) : Promise<void>;
}

export type common = boolean | number | string;

export enum ConfigurationType {
	COMMON,
	WINDOW,
	EQUATIONS,
	UNKNOWN
}

/**
 * Wrapper and adapter for *idb* functionality.
 * Manages settings to be persisted between sessions. This contains all setting 
 * keys and defaults and type resp. store information.
 */
export class ParametersDb {
	dbName = "de.habelt-jena.KatexInputHelper";
	db: any = null;
	
	_commonStore: string = "commonStore";
	_layoutStore: string = "layoutStore";
	_customEquationsStore: string = "customEquationsStore";
	_stores: string[];

	_commonKeys: string[];
	_windowKeys: string[];
	_commonDefaults: common[];
	_windowDefault: any;
	_equationsDefault: any[];
	
	queue = [];
	ongoingPut = false;
	
	/**
	 * Constructor.
	 */
	constructor() {

		this._stores = [					// order matters
			this._commonStore,
			this._layoutStore,
			this._customEquationsStore,
			
		];
		this._commonKeys = [
			"migrated",						// meta
			"style", 
			"localType", 
			"autoUpdateTime", 
			"menuupdateType",
			"autoupdateType", 
			"persistEquations",
			"persistWindowPositions"
		];
		this._commonDefaults = [
			false,
			"aguas", 
			"en_US", 
			500, 
			true,
			true, 
			true,
			true
		];
		this._windowKeys = [ 
			"wf_BRACKET_SYMBOLS_MORE", 
			"wf_ARROW_SYMBOLS_MORE", 
			"wf_RELATION_SYMBOLS_MORE", 
			"wf_FR_CHAR_MORE", 
			"wf_BBB_CHAR_MORE", 
			"wf_L_U_GREEK_CHAR_MORE", 
			"wf_ALL_CHAR_MORE", 
			"wf_EQUATION_MORE", 
			"wf_COMMUTATIVE_DIAGRAM_MORE", 
			"wf_CHEMICAL_FORMULAE_MORE", 
			"wf_HORIZONTAL_SPACING_MORE", 
			"wf_VERTICAL_SPACING_MORE", 
			"wf_SPECIAL_CHARACTER_MORE", 
			"wf_CUSTOM_EQUATIONS_MORE",

			"wEDITOR_PARAMETERS",
			"wINFORMATIONS",
			"wLANGUAGE_CHOISE",
			"wSTYLE_CHOISE",
			"wMATRIX",
			"wUNICODES_LIST",
			"wLANGUAGE_LIST",
			"wEVENT_LIST"			
		];
		this._windowDefault = {
			width: 'auto',
			height: 'auto'
		};
		this._equationsDefault = [ ];
	}

	/**
	 * Enqueues a single property to the property queue.
	 */
	enqueue(store: string, prop: string, value: any) {
		this.queue.push([ store, prop, value ]);
		if (!this.ongoingPut) {
			this.ongoingPut = true;
			this.startDequeue();
		}
	}

	/**
	 * Private *put queue* processing.
	 */
	startDequeue() {
		const [ store, prop, value ] = this.queue.shift(); 
		this.db.put(store, value, prop)
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
	 * Opens an instance of the *idb* database. This is able to perform upgrades,
	 * if the schema / version of the database has changed.
	 */
	async open() {
		try {
			const inst = this;
			this.db = await openDB(this.dbName, 11, {
				
				// ATTENTION! do not delete existing data.				
				upgrade(...params) : Promise<void> {
					return inst.upgrade(...params);
				},
				
				blocked(currentVersion, blockedVersion, event) {
				},
				blocking(currentVersion, blockedVersion, event) {
				},
				terminated() {
				},
			});
			return this.db;
			
		} catch(error) {
			console.error(`Error opening the indexedDB database : %s`, error);
		}
	}
	
	/**
	 * Wrappper of the *get* db method.
	 */
	async get(store:string, key: string) : Promise<any> {
		return await this.db.get(store, key);
	}

	/**
	 * Wrappper of the *put* db method.
	 */
	async put(store:string, key: string, val: any) : Promise<void> {
		await this.db.put(store, val, key);
	}
	
	/**
	 * Puts a parameter into the db as opposed to enqueues.
	 */
	async putParameter(key: string, val: any) : Promise<void> {
		if (this.db === null) { return; }

		const type = this.typeOf(key);
		if (type !== ConfigurationType.UNKNOWN) {
			const store = this.stores[type];
			await this.put(store, key, val);
		}
	}

	/**
	 * Gets a common setting. This is able to provide a default.
	 */
	async getCommon(name: string, deflt: any) {
		try {
			return await this.db.get(this._commonStore, name);
		} catch(e) {
			return deflt;									// probably no entry -> return default
		}
	}
	
	/**
	 * Returns the stores array.
	 */
	get stores() : string[] { return this._stores; }

	/**
	 * Returns the commonKeys array.
	 */
	get commonKeys() : string[] { return this._commonKeys; }

	/**
	 * Sets the commonKeys array.
	 */
	set commonKeys(keys: string[]) { this._commonKeys = keys; }

	/**
	 * Returns the windowKeys array.
	 */
	get windowKeys() : string[] { return this._windowKeys; }

	/**
	 * Sets the windowKeys array.
	 */
	set windowKeys(keys: string[]) { this._windowKeys = keys; }
	
	/**
	 * Returns the equationsKeys array (only a single entry at the moment).
	 */
	get equationsKeys() : string[] { return [ 'equationCollection' ]; }

	/**
	 * Enumerates the Configuration Keys togther with their store.
	 */
	*getConfigurationKeys() : IterableIterator<[ string, string ]> {
		const inst = this;
		yield* this.commonKeys.map((key) => [ inst._commonStore, key ]) as [ string, string ][];
		yield* this.windowKeys.map((key) => [ inst._layoutStore, key ]) as [ string, string ][];
		yield* this.equationsKeys.map((key) => [ inst._customEquationsStore, key ]) as [ string, string ][];
	}

	/**
	 * Enumerates the Configuration Keys togther with their store, here as getter.
	 */
	get configurationKeys() : IterableIterator<[ string, string]> {
		return this.getConfigurationKeys();
	}

	/**
	 * If key is a common key (style, locale, etc.)
	 */
	isCommonKey(key:string) : boolean {
		return this.commonKeys.includes(key);
	}

	/**
	 * If key is a window id.
	 */
	isWindowKey(key:string) : boolean {
		return this.windowKeys.includes(key);
	}

	/**
	 * If key is an equations key.
	 */
	isEquationsKey(key: string) : boolean {
		return key === 'equationCollection';
	}

	/**
	 * Checks if a key is in general a settings name.
	 * 
	 * @param key - the key to check
	 * @returns true if it's a setting
	 */
	isConfigurationKey(key: string) : boolean {
		return (
			this.isCommonKey(key) || 
			this.isWindowKey(key) || 
			this.isEquationsKey(key));
	}

	/**
	 * The type of a settings key.
	 * 
	 * @param key - the property
	 * @returns the type from the *ConfigurationType* enum
	 */
	typeOf(key: string) : ConfigurationType {
		
		if (this.isCommonKey(key)) { return ConfigurationType.COMMON; }
		if (this.isWindowKey(key)) { return ConfigurationType.WINDOW; }
		if (this.isEquationsKey(key)) { return ConfigurationType.EQUATIONS; }
		return ConfigurationType.UNKNOWN;	
	}

	/**
	 * Returns the default setting of a given property or key.
	 * 
	 * @param key - the property
	 * @returns the default value to be used f.i. for creation of an entry
	 */
	defaultOf(key: string) : any {
		
		if (this.isCommonKey(key)) {
			const idx = this.commonKeys.indexOf(key);
			return this._commonDefaults[idx];
		}
		if (this.isWindowKey(key)) {
			return this._windowDefault;
		}
		if (this.isEquationsKey(key)) {
			return this._equationsDefault;
		}
		
		return undefined;
	}

	/**
	 * Returns the configuration keys for one store.
	 * 
	 * @param idx - the store index (0, 1, 2)
	 */
	keysOf(idx: number) : string[] {
		switch(idx) {
			case 0: return this.commonKeys;
			case 1: return this.windowKeys;
			case 2: return this.equationsKeys;
		}
		return [];
	}

	/**
	 * Enqueues a property to be written to a db store.
	 */
	enqueueParameter(prop: string, value: any) {
		if (this.db === null) { return; }
		
		const type = this.typeOf(prop);
		if (type !== ConfigurationType.UNKNOWN) {
			const store = this.stores[type];
			this.enqueue(store, prop, value);
		}
	}
		
	/**
	 * Upgrade of the database version.
	 */
	async upgrade(db, oldVersion, newVersion, transaction, event) : Promise<void> {
		
		console.info(`Migrating database from version ${oldVersion} to ${newVersion}`);
		
		for (const store of this.stores) {
			if (!db.objectStoreNames.contains(store)) {
				db.createObjectStore(store);
			}
			
			const idx = this.stores.indexOf(store);
			const keys = await transaction.objectStore(store).getAllKeys();
			const existingKeys: Set<string> = new Set(keys);
			const schemaKeys: Set<string> = new Set(this.keysOf(idx));
			
			const newKeys = schemaKeys.difference(existingKeys);
			const obsoleteKeys = existingKeys.difference(schemaKeys);
			
			for (const key of obsoleteKeys) {
				try {
					await transaction.objectStore(store).delete(key);
				} catch(e) {
					console.warn(`Could not delete : ${key}, ${e}`);
				}
			}
			console.debug(`${obsoleteKeys.size} entries deleted`);
			for (const key of newKeys) {
				try {
					const val = this.defaultOf(key);
					await transaction.objectStore(store).put(val, key);
				} catch(e) {
					console.warn(`Could not create : ${key}, ${e}`);
				}
			}
			console.debug(`${newKeys.size} entries created`);
		}
		await transaction.done;
		
		console.info(`Database successfully migrated.`);
	}	
	
	
	/*	RESERVED.
	 */
	async putLayout(id: string, layout: any) {
		await this.db.put(this._layoutStore, layout, id);
	}
	
	async getLayout(id: string) {
		return await this.db.get(this._layoutStore, id);
	}
	
	async getWindowIds() {
		return await this.db.getAllKeys(this._layoutStore);
	}

	async putCommon(name: string, value: any) {
		await this.db.put(this._commonStore, value, name);
	}
	
	async getCommonNames() {
		return await this.db.getAllKeys(this._commonStore);
	}
	
	async getEquationCollection() {
		return await this.db.get(this._customEquationsStore, 'equationCollection');
	}
	
}

