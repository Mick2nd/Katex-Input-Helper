import { openDB } from 'idb';
import { Schema, CommonType, LayoutType, ConfigType, ConfigurationEnum } from './schema.mjs';


/**
 * Wrapper and adapter for *idb* functionality.
 * Manages settings to be persisted between sessions. This contains all setting 
 * keys and defaults and type resp. store information.
 */
export class ParametersDb {
	dbName = "de.habelt-jena.KatexInputHelper";
	db: any = null;
	schema: Schema = null;
	
	queue = [];
	ongoingPut = false;
	
	/**
	 * Constructor.
	 */
	constructor(schema: Schema) {
		this.schema = schema;
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

		const type = this.schema.typeOf(key);
		if (type !== ConfigurationEnum.UNKNOWN) {
			const store = this.schema.stores[type];
			await this.put(store, key, val);
		}
	}

	/**
	 * Gets a common setting. This is able to provide a default.
	 */
	async getCommon(name: string, deflt: any) {
		try {
			return await this.db.get(this.schema._commonStore, name);
		} catch(e) {
			return deflt;									// probably no entry -> return default
		}
	}

	/**
	 * Enqueues a property to be written to a db store.
	 */
	enqueueParameter(prop: string, value: any) {
		if (this.db === null) { return; }
		
		const type = this.schema.typeOf(prop);
		if (type !== ConfigurationEnum.UNKNOWN) {
			const store = this.schema.stores[type];
			this.enqueue(store, prop, value);
		}
	}
		
	/**
	 * Upgrade of the database version.
	 */
	async upgrade(db, oldVersion, newVersion, transaction, event) : Promise<void> {
		
		console.info(`Migrating database from version ${oldVersion} to ${newVersion}`);
		
		for (const store of this.schema.stores) {
			if (!db.objectStoreNames.contains(store)) {
				db.createObjectStore(store);
			}
			
			const idx = this.schema.stores.indexOf(store);
			const keys = await transaction.objectStore(store).getAllKeys();
			const existingKeys: Set<string> = new Set(keys);
			const schemaKeys: Set<string> = new Set(this.schema.keysOf(idx));
			
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
					const val = this.schema.defaultOf(key);
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
		await this.db.put(this.schema.layoutStore, layout, id);
	}
	
	async getLayout(id: string) {
		return await this.db.get(this.schema.layoutStore, id);
	}
	
	async getWindowIds() {
		return await this.db.getAllKeys(this.schema.layoutStore);
	}

	async putCommon(name: string, value: any) {
		await this.db.put(this.schema.commonStore, value, name);
	}
	
	async getCommonNames() {
		return await this.db.getAllKeys(this.schema.commonStore);
	}
	
	async getEquationCollection() {
		return await this.db.get(this.schema.customEquationsStore, 'equationCollection');
	}
	
}

