import { Buffer } from 'buffer';

/**
 * @abstract Factory method generating a Proxy for KIHParameters.
 */
export function ParametersProxy() {
	let parameters = new KIHParameters();
	return new Proxy(
		parameters,
		{
			set(target, prop, value, receiver) {
				let changed = target[prop] != value;
				if (changed) {
					target[prop] = value;
					target.storeCookie(prop, value);
					if (!target.transaction.isOngoingTransaction) {
						target.transaction.complete();
					}
				}
				return true;
			}
		});
}

/**
 * @abstract Manages control parameters, especially those which can be stored over sessions.
 * 
 * It is based on the communication of messages to gain the settings of the plugin.
 */
export class KIHParameters {
	
	id = 'Katex Input Helper';
	style = "aguas";
	localType = "en_US";
	encloseAllFormula = false; 
	autoUpdateTime = 500; 
	menuupdateType = true; 
	autoupdateType = true; 

	equation = "";
	equationCollection = [ ];
	dialogSettingsPrefix = "KIH_Location_";
	persistEquations = true;
	persistWindowPositions = true;
	blockWrite = false;
	
	transaction = null;
	mouseState = null;
	displayMode = true;
	mode = "plugin";
	
	/**
	 * @abstract Constructor.
	 */
	constructor() {
		this.transaction = new Transaction();
		this.transaction.configure(this.writeParameters.bind(this));
		this.mouseState = new MouseState(this.transaction);
		
		document.cookie = "mjx.menu=";
	}
	
	/**
	 * @abstract Queries the parameters from the Plugin.
	 */
	async queryParameters() {
				
		let inst = this;
		let api = window.webviewApi; 
		if (!api) {
			this.mode = "web";
			api = { postMessage: async ( o ) => { 
					return inst.loadCookies();
				} 
			}; 
		}
		let response = await api.postMessage({
			id: this.id,
			cmd: 'getparams'
		});
		if (response) {
			inst.transaction.begin();
			for (const [key, val] of Object.entries(response)) {
				if (key == 'displayMode') {
					console.debug(`Parameters : queryParameters : displayMode ${val} `);
				}
				inst[key] = val;
				if (key.startsWith('w')) {
					inst.resizePanel(key);
				}
			}
			// Window position mismatch
			//inst.resetWindowPositions();
			inst.transaction.end();
			
			/**
			 * Is there a way to use messages to return data to the caller?
			 * Experience says NO!
			 * 
			 * TODO: CHECK! IS THERE A DANGER ON THIS?
			 * 
			$(window).bind('unload', async function() {
				let response = await webviewApi.postMessage({
					id: this.id,
					cmd: 'sendparams',
					check: true
				});
				return true;
			});
			*/
		} else {
			console.warn(`The "Katex Input Helper" plugin did not return a response to get parameters `);
		}
	}

	/**
	 * @abstract Resets all window positions. Defaults will be activated.
	 * 
	 * The defaults are taken from css file *dialog.css* (application css file).
	 */	
	resetWindowPositions() {
		this.transaction.begin();
		let css = new Css();

		for (const [key, val] of Object.entries(this)) {
			if (key.startsWith('w')) {
				let o = css.dimensionsOf(key);
				this[key] = o;
				$(`#${key}`).panel('resize', o);
				
				// TODO: has no effect, restart required
				//options.top = o.top;
				//options.left = o.left;
				//$(`#${key}`).panel('move', this[id]);
			}
		}

		this.transaction.end();
	}
	
	/**
	 * @abstract Returns the window ids as array.
	 */
	get windowIds() {
		return Object.keys(this).filter(key => key.startsWith('w'));
	}
	
	/**
	 * @abstract Returns the windows selectors as one string.
	 */
	get windowSelectors() {
		return this.windowIds.map(key => `#${key}`).join(',');
	}
	
	/**
	 * @abstract Writes parameters to the HIDDEN field as required to return some values back
	 * 			 to the caller.
	 */
	writeParameters(equation = "") {
		let parameters = JSON.stringify(this.filteredParameters);
		$('#hidden').attr('value', parameters);
		this.debugPrint();
	}
	
	/**
	 * @abstract Filters some parameters out from the attributes of this instance.
	 * 
	 * Those are not needed as settings nor are they JSON stringifyable.
	 * 
	 * @returns the filtered settings keys
	 */
	get filteredParameters() {
		let o = { };
		let doNotUse = [ "transaction", "displayMode", "mouseState", "mode" ];
		for (const [key, val] of Object.entries(this)) {
			if (!doNotUse.some(item => item == key)) {
				o[key] = val;
			}
		}
		
		return o;
	}
	
	/**
	 * @abstract Checks for a single key if its data item should be stored as Cookie.
	 * 
	 * @param {string} key - the key to be checked
	 * @param {boolean} [persistEquations=true] - setting for equationCollection
	 * @param {boolean} [persistWindowPositions=true] - setting for window positions
	 */
	shouldBeStored(key, persistEquations = true, persistWindowPositions = true) {
		let doUse = [ 
			"style", 
			"localType", 
			"equation",
			"autoUpdateTime", 
			"menuupdateType",
			"autoupdateType", 
			"persistEquations",
			"persistWindowPositions"
		];
		return (
			this.mode == 'web' && 
			(doUse.some(item => item == key) || 
			 (persistWindowPositions && key.substring(0, 1) == 'w') ||
		 	 (persistEquations && key == "equationCollection")));
	}
	
	/**
	 * @abstract Store a single cookie after checking if it's desired.
	 * 
	 * @param {string} key - key, e.g. name of the item to be stored
	 * @param {*} val - value to be stored
	 */
	storeCookie(key, val) {
		if (this.shouldBeStored(key, this.persistEquations, this.persistWindowPositions)) {
			let json = null;
			try {
				json = JSON.stringify(val);
				let final = json;
				if (key == 'equation' || key == 'equationCollection') {				
					final = Buffer.from(json, 'utf8').toString('hex');
				}
				window.localStorage.setItem(key, final);
			} catch(e) {
				alert(`alert : ${json} : ${e}`);
				window.localStorage.removeItem(key);
			}
		} else {
			window.localStorage.removeItem(key);
		}
	}

	/**
	 * @abstract Loads all cookies. Cookies must be defined and must not be deactivated.
	 */
	loadCookies() {
		try {
			let cookies = { };
			let persist = window.localStorage.getItem('persistEquations') == 'true';
			const persistEquations = persist;
			persist = window.localStorage.getItem('persistWindowPositions') == 'true';
			const persistWindowPositions = persist;
			
			for (let idx = 0; idx < window.localStorage.length; idx++) {
				const key = window.localStorage.key(idx);
				let val = window.localStorage.getItem(key);
				if (val == '') { continue; }
				if (this.shouldBeStored(key, persistEquations, persistWindowPositions)) {
					try {
						if (key == 'equation' || key == 'equationCollection') {
							val = Buffer.from(val, 'hex').toString('utf-8');
						}
					} catch(e) { 
						alert(`Hex Cookie conversion error : ${key} : ${e}`);
					}
					val = JSON.parse(val); 
					cookies[key] = val;
				}
			}
			
			return cookies;
			
		} catch(e) {
			let msg = `Cookies inconsistent : ${e}`;
			console.warn(msg);
			alert(msg);
			this.resetCookies();
			return { };
		}
	}
	
	/**
	 * @abstract Resets the cookies if they are in a inconsistent or fresh state.
	 */
	resetCookies() {
		for (const [ key, val ] of Object.entries(this.filteredParameters)) {
			this.storeCookie(key, val);
		}
	}
		
	/**
	 * @abstract onPanelMove handler for some dialogs and windows.
	 */
	onPanelMove(id, left, top) {
		if (!(id in this)) {
			this[id] = { };
		}
		if (id in this && (this[id].left != left || this[id].top != top)) {
			this[id].left = left;
			this[id].top = top;
			this.mouseState.increment();
			// TODO: check
			//let dimensions = this.getPanelDimensions(id);
			//this[id].width = dimensions.width;
			//this[id].height = dimensions.height;
			
			this.transaction.complete();
		}

		if (this.mode == 'web') {
			this.storeCookie(id, this[id]);
		}
	}
	
	/**
	 * @abstract onPanelResize handler for some dialogs and windows.
	 * 
	 * A Resize can also change *left* and *top* values. That's why we must include 
	 * those into consideration and add them to the object.
	 * TODO: this only works, if left / top are updated during resize!!
	 * EXPERIENCE: resize with left change persisted although onPanelMove not detected
	 * 
	 * @param id - id of the panel
	 * @param width - the width established by the user
	 * @param height - the height established by the user
	 */
	onPanelResize(id, width, height) {
		if (!(id in this)) {
			this[id] = { };
		}
		if (id in this && (this[id].width != width || this[id].height != height)) {
			this[id].width = width;
			this[id].height = height;
			this.mouseState.increment();								// counts the number of resize / move events
			
			let dimensions = this.getPanelDimensions(id);
			this.check(this[id], dimensions);							// checks for discrepancy
			this[id].left = dimensions.left;
			this[id].top = dimensions.top;
			
			this.transaction.complete();
		}
		
		if (this.mode == 'web') {
			this.storeCookie(id, this[id]);
		}
	}
	
	/**
	 * @abstract Checks for discrepancy between handler and options dimensions.
	 */
	check(windowState, dimensions) {
		if (Math.abs(windowState.width - dimensions.width) > 5 	||
			Math.abs(windowState.height - dimensions.height) > 5) {
			console.warn('KIHParameters : discrepancy deteced during window resize');
		}
	}
	
	/**
	 * @abstract Resizes (and repositions) a given panel by using the 'configured' settings.
	 * 
	 * For repositioning after reset a restart is required.
	 * 
	 * @param id - the panel id as in HTML
	 */
	resizePanel(id) {
		if (id in this && this[id] != undefined) {
			try {
				let o = this[id];
				$(`#${id}`).panel('resize', o);
			} catch(e) {
				console.error(`Exception resizing panel ${id} : ${e}`);
			}
		}
	}
	
	/**
	 * @abstract Returns the complete panel dimensions as from options.
	 * 
	 * TODO: Seems to be not correct!
	 */
	getPanelDimensions(id) {
		let options = $(`#${id}`).panel('options');
		let dimensions = { 
			left: options.left, 
			top: options.top, 
			width: options.width, 
			height: options.height 
		};
		return dimensions;
	}
	
	/**
	 * @abstract Selected console output of the attributes.
	 */
	debugPrint() {
		this.printEquation();
		this.printEquationCollection();
		this.printSettingsConfiguration();
		this.printWindowConfiguration();
	}

	/**
	 * @abstract Console output of the equation.
	 */
	printEquation() {
		console.debug(`Return-Parameter : ${JSON.stringify(this.equation)} `);
	}
	
	/**
	 * @abstract Console output of the Custom Equations.
	 */
	printEquationCollection() {
		console.debug(`Equations-Parameter : ${JSON.stringify(this.equationCollection)} `);
	}
	
	/**
	 * @abstract Console output of the settings.
	 */
	printSettingsConfiguration() {
		for (const key of this.configurationKeys) {
			console.debug(`Settings-Parameters : ${key} : ${this[key]} `);
		}
	}

	/**
	 * @abstract Console output of the Window Size and Position.
	 */
	printWindowConfiguration() {
		for (const key of this.windowKeys) {
			console.debug(`Window-Parameters : ${key} : ${JSON.stringify(this[key])} `);
		}
	}
	
	/**
	 * @abstract Returns the settings configuration keys.
	 */
	get configurationKeys() {
		return [
			"id",
			"style",
			"localType",
			"encloseAllFormula", 
			"autoUpdateTime", 
			"menuupdateType", 
			"autoupdateType", 
			"persistEquations",
			"persistWindowPositions"			
		];
	}
	
	/**
	 * @abstract Returns the window configuration keys.
	 */
	get windowKeys() {
		return Object.keys(this).filter(s => s.startsWith('w'));
	}
}

/**
 * @abstract Supports transactions.
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
	 * @abstract Constructor
	 */
	constructor() {
		
	}
	
	/**
	 * @abstract Configures the instance by providing *Completion* and *End* routines.
	 */
	configure(onComplete, onEnd = onComplete) {
		this.onComplete = onComplete;
		this.onCompleteBackup = onComplete;
		this.onEnd = onEnd;
		this.onEmpty = (...args) => { };
	}
	
	/**
	 * @abstract Completes a single *Action* but not during a *Transaction*.
	 * 
	 * Executes the Completion routine, but not during a Transaction.
	 */
	complete(...args) {
		this.onComplete(...args);
	}
	
	/**
	 * @abstract Begins a *Transaction*. The completion routine is deactivated.
	 */
	begin() {
		this.onComplete = this.onEmpty;
	}
	
	/**
	 * @abstract Ends a *Transaction*.
	 * 
	 * The *End* routine is executed, then the Completion routine is re-activated.
	 */
	end(...args) {
		this.onEnd(...args);
		this.onComplete = this.onCompleteBackup;
	}
	
	cancel() {
		this.onComplete = this.onCompleteBackup;
	}
	
	/**
	 * @abstract Checks and returns, if there is an ongoing Transaction.
	 */
	get isOngoingTransaction() {
		return this.onComplete === this.onEmpty;
	}
}

/**
 * @abstract This class supports retrieval of css info from the *dialog.css* CSS file.
 * 
 * This is used to reset the dimensions of the dialogs.
 */
class Css {
	sheet = null;
	
	/**
	 * @abstract Constructor.
	 */
	constructor() {
		this.findSheet();
	}
	
	/**
	 * @abstract Finds the style sheet.
	 */
	findSheet() {
		let sheets = [ ];
		for (const sheet of document.styleSheets) {
			if (sheet.href && sheet.href.endsWith('main.css')) {
				sheets.push(sheet);
				this.sheet = sheet;
				//return;
			}
		}
		if (sheets.length != 1) {
			console.warn(`Number of main.css sheets is ${sheets.length}`);
		}
	}
	
	/**
	 * @abstract Searches for and retrieves the width and height given the window id.
	 * 
	 * @param id - the id of the window (id attribute)
	 * @returns object with width and height entries, returns *auto* if not found
	 */
	dimensionsOf(id) {
		try {
			for (const rule of this.sheet.cssRules) {
				if (rule.type == rule.STYLE_RULE && rule.selectorText === ('#' + id) && rule.styleMap != null) {
					const width = rule.styleMap.get('width');
					const height = rule.styleMap.get('height');
					const dim = {
						width: width.value + width.unit,
						height: height.value + height.unit,
						left: "50% - (width.value / 2 + width.unit)",
						top: "50% - (height.value / 2 + height.unit)"
					};
					
					return dim;
				}
			}
		} catch(e) {
			const msg = `Style not found for ${id} : ${e}`;
			console.warn(msg);
		}
		const msg = `Style not found for ${id}`;
		console.warn(msg);
		
		return { width: 'auto', height: 'auto', left: '30%', top: '30%'};
	}
}

/**
 * @abstract Used to reduce write back to the hidden field based on the use of
 * 			 Transactions and observation of the mouse state.
 * 
 * The hopes has not fulfilled as there is already a reduction of mouse events during
 * a size or position change.
 */
class MouseState {

	transaction = null;
	windowEvents = 0;
	mouseUp = true;
	active = false;										// currently deactivated

	constructor(transaction) {
		this.transaction = transaction;
		let inst = this;

		if (this.active) {
			$('body').on('mousedown', function (event) {
				inst.mouseUp = false;
				inst.reset();
				inst.transaction.begin();
			});
			$('body').on('mouseup', function (event) {
				inst.mouseUp = true;
				if (inst.isWindowChanged) {
					inst.transaction.end();
					console.debug(`MouseState : ${inst.windowEvents} window events during transaction`);
				} else {
					inst.transaction.cancel();
					console.debug(`MouseState : no window events during transaction`);
				} 
			});
		}
	}
	
	reset() {
		this.windowEvents = 0;
	}
	
	increment() {
		this.windowEvents ++;
		console.debug(`MouseState : incremented to : ${this.windowEvents} `);
	}
	
	get isWindowChanged() {
		return this.windowEvents > 0;
	}
}

// This helps to import symbols in test suite
try {
	module.exports = { Css, KIHParameters, ParametersProxy, Transaction };
} catch(e) { }
