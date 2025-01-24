const path = require('path');
const storage = require('node-persist');
const chokidar = require('chokidar');

import { Observable } from './observable';


export namespace DataExchangeNs
{
	/**
	 * @abstract This class supports the data exchange between the Plugin and the MarkdownIt script
	 * 
	 * It does this by using two mechanisms:
	 * - a persistent storage to exchange the data
	 * - a file system watcher for detection of changes
	 * 
	 * This is the super class of the Transmitter and Receiver classes.
	 */
	class DataExchange
	{
		/**
		 * @abstract Constructor (private) will never be invoked directly by clients
		 * 
		 */
		public constructor(pluginId: string, dataPath: string)
		{
			this.pluginId = pluginId;
			this.dataPath = dataPath;
			this.prepareStorage();
		}
		
		/**
		 * @abstract Prepares the storage
		 */
		prepareStorage() : void
		{
			this.storage = storage.create();
			this.storage.initSync({ dir: this.dataPath });
		}
		
		pluginId: string = '';
		dataPath: string;
		storage: any;
	}
	
	/**
	 * @abstract Class for the Transmitter role.
	 * 
	 * Usage scenario:
	 * - Instantiate by providing plugin id and path
	 * - Use send invocations to send the data
	 */
	export class Transmitter extends DataExchange {
		
		constructor(pluginId: string, dataPath: string) {
			super(pluginId, dataPath);
		}

		/**
		 * @abstract Writes settings to persisted storage, meant for data exchange with the 
		 * 			 MarkdownIt script. Invoked by Plugin onChanged - handler.
		 */
		public send(name: string, data: any) : void
		{
			this.storage.setItemSync(name, data);	
		}
	}
	
	/**
	 * @abstract Class for the Receiver role.
	 * 
	 * Usage scenario:
	 * - Instantiate by providing plugin id and path
	 * - Use subscribe invocations to register observers
	 * - Observes the file system for changes
	 * - Notifies the registered Observers about changes
	 */
	export class Receiver extends DataExchange {

		constructor(pluginId: string, dataPath: string) {
			super(pluginId, dataPath);
			
			this.observable = new Observable();
		}
		
		subscribe(name: string, observer: Function) {
			this.observable.subscribe(name, observer);
		}

		unsubscribe(name: string, observer: Function) {
			this.observable.unsubscribe(name, observer);
		}

		/**
		 * @abstract Watch storage directory
		 */ 
		prepareWatcher() : void
		{
			var inst = this;
			/**
			 * @abstract This handler handles the pending storage items (notifies Observers)
			 */
			function handler(event: string, path: any) {
				
				console.info(`${this.pluginId} : File changed or added : ${event}, ${path}`);
				const keys = inst.storage.keysSync();
				for (const key of keys) {
					const data = inst.storage.getItemSync(key);
					inst.storage.removeItemSync(key);
					inst.observable.notify(key, data);
				}
			}
			
			this.watchPath = path.join(this.dataPath, '*');
			this.watcher = chokidar.watch(this.watchPath, { persistent: true });
			this.watcher
			.on('add', handler)
			.on('change', handler);			
		}
		
		watchPath: string;
		watcher: any;
		observable: Observable;
	}
}
