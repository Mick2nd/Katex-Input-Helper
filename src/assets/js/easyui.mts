import { IEasyuiLoader, easyuiLoaderId } from './interfaces.mjs';


/**
 * Converts a method with given signature and callback to a Promise returning method.
 * A special case is the use of setTimeout, where the order of arguments is swapped.
 * 
 * @async implements the Promise contract
 * @param fnc - a function object to be invoked
 * @param args - args of the function. The function has one additional callback parameter
 * @returns the Promise, will be fulfilled if the callback is invoked
 */
async function promisify(fnc: any, ...args: any[]) {
	return new Promise(function(resolve, reject) {
		try {
			function resolveFunc() {
				let msg = `Promise check: ${args} `;
				console.debug(msg);
				resolve('Success');
			}
			
			if (fnc === setTimeout) {
				setTimeout(function() {
					resolveFunc();
				}, ...args);
			} else {
				fnc(...args, function() {
					resolveFunc();
				});
			}
		} catch(err) {
			console.error(`Error occurred: ${err} `);		
			reject(err);
		}		
	});
}

/**
 * Class responsible for loading the Easyui package.
 */
export class EasyuiLoader implements IEasyuiLoader {
	
	deferredList: string[];
	primaryList: string[];
	easyloader: any = null;
	
	/**
	 * Constructor. Prepares a few data structures and access of easyui to jQuery.
	 */
	constructor() {
		window.$ = window.jQuery = $;			// provides access for easyloader and easyui

		this.deferredList = [
			'datagriddnd',
			'datagridfilter',
			'datagridcellediting',
		];
		this.primaryList = EASYUI_INCLUDES.filter((elem) => !this.deferredList.includes(elem) && elem !== 'tabs_icons');
	}
	
	/**
	 * Preloads the messager plugin.
	 */
	async preload() {
		await this.usingAsync(['tabs', 'messager']);
	}
	
	/**
	 * Essential workflow (other trials did not work):
	 * - first load basic plugins
	 * - then register plugin-extensions
	 * - finally load those plugin-extensions
	 */
	async load() {
		await this.usingAsync(this.primaryList);
		this.registerExtensions(this.easyloader);	
		await this.usingAsync(this.deferredList);			
	}

	/**
	 * Registers extensions for the EASYUI plugins, here: datagrid.
	 */
	registerExtensions(easyloader: any) {
		$.extend(easyloader.modules, {
			datagriddnd: {
				js:'../datagrid-dnd.js',
				dependencies: ['datagrid']
			},
			datagridfilter: {
				js:'../datagrid-filter.js',
				dependencies: ['datagrid']
			},
			datagridcellediting: {
				js:'../datagrid-cellediting.js',
				dependencies: ['datagrid']
			}
		});
	}

	/**
	 * A using function encapsulated by a Promise.
	 * 
	 * @async implements the Promise contract
	 * @param script - the url of the script to be loaded
	 * @returns - the Promise indicating the state of the transaction
	 */
	async usingAsync(modules: string[]) : Promise<any> {
		try {
			if (this.easyloader == null) {
				const { easyloader } = (await import('./jquery-easyui/easyloader.js'));
				easyloader.base = this.getBaseLocation();
				this.easyloader = easyloader;
			}
			const ready = await promisify(/*using*/this.easyloader.load.bind(this.easyloader), modules);
			return ready;
		} catch(e) {
			console.error(`Could not load 'easyui' ${e}`);
			throw e;
		}
	}

	/**
	 * Sets the base location.
	 * 
	 * This will be needed for relative paths of some content like css or js files.
	 * Is here used only for *easyloader*.
	 * 
	 * @returns the location of this script, ending with a slash
	 */
	getBaseLocation() : string {
		const location = (document.currentScript as HTMLScriptElement).src
			.split('/')
			.slice(0, -1)
			.join('/')
			.replace(/ /g, '%20')
			.replace('file:///', 'file://')
			.replace('file://', 'file:///') + '/';
			
		console.info(`Base location (1) is : '${location}'`);
		return location;
	}
}

export default 1;