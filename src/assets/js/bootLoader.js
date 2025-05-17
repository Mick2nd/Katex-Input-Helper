
import jquery from './jquery-plugin/jquery.min';
import './jquery-easyui/jquery.easyui.min';
import './jquery-easyui/datagrid-dnd';
import './jquery-easyui/datagrid-filter';
import './jquery-easyui/datagrid-cellediting';
import katex from 'katex/dist/katex';
import 'katex/dist/contrib/mhchem';
import CodeMirror from './codemirror/lib/codemirror';

import { Observable } from './patterns/observable';
import { Localizer } from './localization';
import { Themes } from './themes';
import { ParserExtension } from './parserExtension';
import { KIHParameters } from './parameters';
import { MathFormulae } from './math';
import { KatexInputHelper } from './dialog';
import { FileHandler } from './fileHandling';
import { CategoriesTree } from './categoriesTree';
import { DynamicPanel } from './panels';

/**
 * @abstract The boot loader of the Katex Input Helper.
 * 
 * This is capable of supporting 2 different scenarios, one using *easyloader*, one not. 
 */
export class BootLoader {
	
	baseLocation = null;
	vme = null;
	
	/**
	 * @abstract Constructor.
	 */
	constructor() {

	}

	/**
	 * @abstract Converts a method with given signature and callback to a Promise returning method.
	 * 
	 * A special case is the use of setTimeout, where the order of arguments is swapped.
	 * 
	 * @async implements the Promise contract
	 * @param fnc - a function object to be invoked
	 * @param args - args of the function. The function has one additional callback parameter
	 * @returns the Promise, will be fulfilled if the callback is invoked
	 */
	async promisify(fnc, ...args) {
		return new Promise(function(resolve, reject) {
			try {
				function resolveFunc() {
					var msg = `Promise check: ${args} `;
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
	 * @abstract The promise is fulfilled if the document becomes ready.
	 * 
	 * @async implements the Promise contract
	 */
	async readyAsync() {
		var doc = $(document);
		return this.promisify(doc.ready.bind(doc));
	}
	
	/**
	 * @abstract The promise is fulfilled after a timeout is elapsed.
	 * 
	 * @async implements the Promise contract
	 */
	async setTimeoutAsync(delay) {
		return this.promisify(setTimeout, delay);
	}	
	
	/**
	 * @abstract Initializes the app.
	 * 
	 * This is the true application logic.
	 * 
	 * @async implements the Promise contract
	 */
	async initApp(useEasyLoader) {
		try {
			this.vme = new KatexInputHelper(useEasyLoader);
			window.vme = this.vme;											// prevents garbage collection?
			await this.vme.initialise();
			$('#myContainer').layout({fit: true});
			$('#divEquationInputOutput').layout({});
		} finally {
		}
	}
	
	/**
	 * @abstract Initialization scenario 1 : without easy loader.
	 * 
	 * @async implements the Promise contract
	 */
	async init1() {
		var counter = 20;
		while (!this.presenceCheck(counter) && --counter >= 0) {
			await this.setTimeoutAsync(100);
		}
		console.info(`jquery loaded : ${typeof $} `);
		
		await this.readyAsync();
		console.debug('Promise check : document ready.');
		
		await this.initApp(false);
		console.debug('Promise check : app started.');
		this.check();
	}
	
	/**
	 * @abstract Checks the presence of the required scripts.
	 */
	presenceCheck(cycle) {
		var lastChecked = 'Test';
		function checkTypeByName(type, name, readableName = name) {
			lastChecked = readableName;
			if (type === undefined || type === null || typeof type === 'undefined' || !type.prototype) {
				console.warn(`Undefined type : ${readableName}`);
				return false;
			}
			var detectedName = type.prototype["constructor"]["name"];
			var equal = (detectedName === name);
			if (!equal) {
				console.warn(`Type check failed : ${detectedName} : ${readableName}`);
			}
			return equal;
		}
		function checkOther(type, name, readableName) {
			lastChecked = readableName;
			var equal = type === name;
			if (!equal) {
				console.warn(`Type check failed : ${type} : ${readableName}`);
			}
			return equal;
		}
		function mhchemCheck() {
			try {
				lastChecked = "Mhchem";
				katex.renderToString("\\ce{SO4^2- + Ba^2+ -> BaSO4 v} ", { throwOnError: true });
				return true;
			} catch(e) {
				console.warn(`Presence check failed : Mhchem`);
				return false;
			}
		}
		
		var allLoaded = (
			// false &&
			checkOther(typeof $, 'function', 'jquery') &&
			checkOther(typeof $.messager, 'object', 'easyui') &&
			checkOther(typeof $.fn.datagrid, 'function', 'datagrid') &&
			checkOther(typeof $.fn.datagrid.defaults, 'object', 'datagrid') &&
			checkOther(typeof $.fn.datagrid.defaults.defaultFilterOptions, 'object', 'datagrid-filter') &&
			// can we independantly check dnd and cellediting?
			checkOther(typeof katex, 'object', 'Katex') &&
			checkOther(typeof katex.renderToString, 'function', 'Katex') &&
			mhchemCheck() &&
			//checkOther(typeof ($.fn.ColorPicker), 'function', 'ColorPicker') &&
			checkTypeByName(CodeMirror, 'CodeMirror', 'CodeMirror') &&
			
			checkTypeByName(Observable, 'Observable') &&
			checkTypeByName(Localizer, 'Localizer') &&
			checkTypeByName(Themes, 'Themes') &&
			checkTypeByName(ParserExtension, 'ParserExtension') &&
			checkTypeByName(KIHParameters, 'KIHParameters') &&
			checkTypeByName(FileHandler, 'FileHandler') &&
			checkTypeByName(MathFormulae, 'MathFormulae') &&
			checkTypeByName(CategoriesTree, 'CategoriesTree') &&
			checkTypeByName(DynamicPanel, 'DynamicPanel') &&
			checkTypeByName(KatexInputHelper, 'KatexInputHelper'));
		if (! allLoaded && cycle <= 0) {
			throw Error(`${lastChecked} not loaded`);
		}
			
		return allLoaded;
	}

	/**
	 * @abstract Performs a check about the presence of certain Html objects and provides
	 * 			 console report.
	 */
	check() {
		var ids = [
			'html',
			'head',
			'body',
			'#bodyPage',
			'#myContainer',
			'.easyui-layout', 
			'.easyui-menubutton',
			'.easyui-dialog',
		];
		for (var id of ids) {
			$(id)
			.each(function() {
				console.debug(`Element check : ${$(this).prop('tagName')} : ${$(this).attr('id')} `);
			});
		}
	}

	/**
	 * @abstract Displays an alert message in case of a crash.
	 */
	fatal(err) {
		alert('The Katex Input Helper could not be opened properly, \n' + 
			`(${err}). \nPlease close it and open it again!`);
	}
}	

if (!window.bootLoaderLoaded) {
	window.bootLoaderLoaded = true;
	var kihBootLoader = new BootLoader();
	kihBootLoader.init1()
	.then(() => {
		kihBootLoader.check();
	})
	.catch(err => {
		console.error(`Error ${err} `, err);
		kihBootLoader.fatal(err);
	});
}

// This helps to import symbols in test suite
try {
	module.exports = BootLoader;
} catch(e) { }
