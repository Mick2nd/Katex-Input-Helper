
/**
 *	With little modification it is possible to load EASYUI asynchronously.
 *	jquery node_module working with ProvidePlugin.
 */
 import { injectable, inject, Factory } from 'inversify';

import { 
	IBootLoader, 
	IKatexInputHelper, katexInputHelperFactoryId, 
	IEasyuiLoader, easyuiLoaderId,
	ILocalizer, localizerId 
	
} from './interfaces.mjs';

/**
 * The boot loader of the Katex Input Helper.
 * It serves as entry point of the application.
 */
@injectable()
export default class BootLoader implements IBootLoader {
	
	factory: Factory<IKatexInputHelper> = null;
	vme: IKatexInputHelper = null;
	easyuiLoader: IEasyuiLoader = null;
	localizer: ILocalizer = null;
	
	/**
	 * Constructor.
	 */
	constructor(
		@inject(easyuiLoaderId) easyuiLoader,
		@inject(localizerId) localizer,
		@inject(katexInputHelperFactoryId) factory: any
	) {
		this.easyuiLoader = easyuiLoader;
		this.localizer = localizer;
		this.factory = factory;
	}

	/**
	 * Converts a method with given signature and callback to a Promise returning method.
	 * 
	 * A special case is the use of setTimeout, where the order of arguments is swapped.
	 * 
	 * @async implements the Promise contract
	 * @param fnc - a function object to be invoked
	 * @param args - args of the function. The function has one additional callback parameter
	 * @returns the Promise, will be fulfilled if the callback is invoked
	 */
	async promisify(fnc: any, ...args: any[]) {
		return new Promise(function(resolve, reject) {
			try {
				function resolveFunc() {
					let msg = `Promise check: ${args} `;
					// Reserved.
					// console.debug(msg);
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
				console.error(`Error occurred: %s`, err);		
				reject(new Error(err));
			}		
		});
	}
	
	/**
	 * The promise is fulfilled if the document becomes ready.
	 * 
	 * @async implements the Promise contract
	 */
	async readyAsync() {
		let doc = $(document);
		return this.promisify(doc.ready.bind(doc));
	}
	
	/**
	 * The promise is fulfilled after a timeout is elapsed.
	 * 
	 * @async implements the Promise contract
	 * @param delay - the time in ms to wait for
	 */
	async setTimeoutAsync(delay: number) {
		return this.promisify(setTimeout, delay);
	}
	
	/**
	 * Initializes the app. This is the true application logic. Performs the
	 * following steps:
	 * 
	 * - start document and easyui initial load
	 * - English language and progress dialog
	 * - easyui final load
	 * - KIH loading including prefetch
	 * - KIH initialization
	 * 
	 * @async implements the Promise contract
	 */
	async initApp() {
		try {
			await Promise.all([ this.readyAsync(), this.easyuiLoader.preload() ]);
			await this.localizer.load('en_US');
			this.startProgressDialog();
			console.debug(`Promise check : document ready: ${document.URL}.`);

			await this.easyuiLoader.load();
			this.vme = await this.factory();
			globalThis.vme = this.vme;							// prevents garbage collection?
			const prefetched = await this.vme.prefetch();		// prefetch can load another page
			if (prefetched) {
				await this.readyAsync();						// in this case must wait for ready.
			}
			await this.vme.initialise();
			console.debug('Promise check : app started.');
			this.check();
			
		} finally {
			console.info('App initialization finished');
		}
	}
	
	/**
	 * Starts the Progress dialog as early as the document is ready.
	 */
	startProgressDialog() {
		$.messager.progress({
			title:	"Katex Input Helper", 
			text:	this.localizer.getLocalText("WAIT_FOR_EDITOR_DOWNLOAD"), 
			msg:	"<center>&copy; " +
						"<a href='mailto:juergen@habelt-jena.de?subject=Katex%20Input%20Helper' target='_blank' class='bt progress' >Jürgen Habelt</a> -" + 
						"<a href='https://github.com/Mick2nd/Katex-Input-Helper' target='_blank' class='bt progress' >A Joplin plug-in</a><br/><br/>" +
					"</center>", 
			interval: 300 
		}); 
	}

	/**
	 * Performs a check about the presence of certain Html objects and provides
	 * console report.
	 */
	check() {
		let ids = [
			'html',
			'head',
			'body',
			'#bodyPage',
			'#myContainer',
			'.easyui-layout', 
			'.easyui-menubutton',
			'.easyui-dialog',
		];
		for (let id of ids) {
			$(id)
			.each(function() {
				// Reserved.
				// console.debug(`Element check : ${$(this).prop('tagName')} : ${$(this).attr('id')} `);
			});
		}
	}

	/**
	 * Displays an alert message in case of a crash.
	 */
	fatal(err: any) {
		alert('The Katex Input Helper could not be opened properly, \n' + 
			`(${err}). \nPlease close it and open it again!`);
	}
}	

// This helps to import symbols in test suite
try {
	module.exports = BootLoader;
} catch(e) { }
