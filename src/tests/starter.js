
/**
 * @abstract The boot loader of the Katex Input Helper.
 * 
 * This is capable of supporting 2 different scenarios, one using *easyloader*, one not. 
 */
class BootLoader {
	
	baseLocation = null;
	withModules = true;
	app = null;
	
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
	 * @abstract A using function encapsulated by a Promise.
	 * 
	 * @async implements the Promise contract
	 * @param script - the url of the script to be loaded
	 * @returns - the Promise indicating the state of the transaction
	 */
	async usingAsync(script) {
		return this.promisify(easyloader.load.bind(easyloader), script);
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
	 * @abstract Initializes the scripts (css and js) using the easyloader.
	 * 
	 * All but this boot loader and the easy loader is loaded here.
	 * 
	 * @async implements the Promise contract
	 */
	async initScripts() {
		var inst = this;
		function makePath(path) {
			return path;
		}
		
		var baseLocation = this.getBaseLocation();
		this.baseLocation = baseLocation;						// this is the assets folder as required by app
		baseLocation += 'js/jquery-easyui/'
		easyloader.base = baseLocation; 						// set the easyui base directory
		easyloader.css = true; 									//this.withModules;
	
		var modules = [ 'layout', 'panel', 'window', 'dialog', 'linkbutton', 'menubutton' ];
		
		var scripts = [ 
			makePath("../patterns/observable.js"),
			makePath("../localization.js"),
			makePath("../parserExtension.js"),
			makePath("../../../tests/testDialog.js"),
		];
		
		/**
		 * It seems that working with my own styles does not work
		 * Use easyloader css = true and do not use (load) theme files below
		 */
		var csss = this.withModules ? [
			makePath("../jquery-easyui-MathEditorExtend/themes/aguas/easyui.css"),
			makePath("../jquery-easyui-MathEditorExtend/themes/icon.css"),
			makePath("../../../tests/testDialog.css"),
		] : [
			makePath("../jquery-easyui/themes/default/easyui.css"),
			makePath("../jquery-easyui/themes/icon.css"),
			makePath("../jquery-easyui-MathEditorExtend/themes/aguas/easyui.css"),
			makePath("../jquery-easyui-MathEditorExtend/themes/icon.css"),
			makePath("../jquery-easyui/themes/aguas/easyui.css"),
			makePath("../../../tests/testDialog.css"),
		];

		for (var css of csss) {
			await this.usingAsync(css);
		}

		await this.usingAsync(makePath('../jquery-easyui/jquery.min.js'));

		if (this.withModules) {
			// TEST: load modules together with different theme activation
			easyloader.theme = "default";
			for (var module of modules) {
				await this.usingAsync(module);
			}			
		} else {
			await this.usingAsync(makePath("../jquery-easyui/jquery.easyui.min.js"));
		}
		
		for (var script of scripts) {
			await this.usingAsync(script);
		}
	}
	
	/**
	 * @abstract Initializes the app.
	 * 
	 * This is the true application logic.
	 * 
	 * @async implements the Promise contract
	 */
	async initApp() {
		try {
			this.app = new TestDialog(this.baseLocation);
			window.app = this.app;
			await this.app.initialize();
		} finally {
		}
	}
	
	/**
	 * @abstract Initialization scenario 1 : without easy loader.
	 * 
	 * @async implements the Promise contract
	 */
	async init1() {
		var counter = 50;
		while (!this.presenceCheck(counter) && --counter >= 0) {
			await this.setTimeoutAsync(100);
		}
		console.info(`jquery loaded : ${typeof $} `);
		
		await this.readyAsync();
		console.debug('Promise check : document ready.');
		
		await this.initApp();
		console.debug('Promise check : app started.');
		this.check();
	}

	/**
	 * @abstract Initialization scenario 2 : with easy loader.
	 * 
	 * @async implements the Promise contract
	 */
	async init2() {
		var counter = 0;
		while ((typeof easyloader !== 'object' || !document.currentScript) && ++counter <= 50) {
			await this.setTimeoutAsync(100);
		}
		if (counter > 50) {
			throw Error("easyloader not loaded");
		}
		console.info(`easyloader loaded : ${typeof easyloader} `);

		await this.initScripts();
		console.debug('Promise check : scripts loaded.');
		
		await this.readyAsync();
		console.debug('Promise check : document ready.');
		
		// trial to shift misplaced menus
		// $('#mFile, #mInsert, #mTools, #mView, #mOptions, #mInformations').append($('#menu'));
		
		await this.initApp();
		console.debug('Promise check : app started.');
		this.check();
	}

	/**
	 * @abstract Sets the base location.
	 * 
	 * This will be needed for relative paths of some content like css or js files.
	 * Is here used only for *easyloader*.
	 * 
	 * @returns the location of this script, ending with a slash
	 */
	getBaseLocation() {
		var location = document.currentScript.src
			.split('/')
			.slice(0, -2)
			.join('/')
			.replace(/ /g, '%20')
			.replace('file:///', 'file://')
			.replace('file://', 'file:///') + '/assets/';
			
		return location;
	}
	
	/**
	 * @abstract Checks the presence of the required scripts.
	 */
	presenceCheck(cycle) {
		var lastChecked = 'Test';
		function checkTypeByName(type, name, readableName = name) {
			lastChecked = readableName;
			if (type === undefined || type === null || typeof type === 'undefined') {
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
		
		var allLoaded = (
			checkOther(typeof $, 'function', 'jquery')
		);
			
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
			'#myContainer',
			'.easyui-layout', 
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

var kihBootLoader = new BootLoader();
kihBootLoader.init2()
.then(() => {
	kihBootLoader.check();
})
.catch(err => {
	console.error(`Error ${err} `, err);
	kihBootLoader.fatal(err);
});
