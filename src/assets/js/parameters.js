
/**
 * @abstract Factory method generating a Proxy for KIHParameters.
 */
function ParametersProxy() {
	var parameters = new KIHParameters();
	return new Proxy(
		parameters,
		{
			set(target, prop, value, receiver) {
				var changed = target[prop] != value;
				if (changed) {
					target[prop] = value;
					if (!target.transaction.isOngoingTransaction) {
						// console.debug(`property set: ${prop} = ${value}, set : ${target[prop]}`);
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
class KIHParameters {
	
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
	displayMode = true;
	
	/**
	 * @abstract Constructor.
	 */
	constructor() {
		// TODO: does this work? Evt. move to queryParameters
		this.transaction = new Transaction();
		this.transaction.configure(this.writeParameters.bind(this));
	}
	
	/**
	 * @abstract Queries the parameters from the Plugin.
	 */
	async queryParameters() {
		var inst = this;
		var response = await webviewApi.postMessage({
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
			inst.transaction.end();
		} 
	}

	/**
	 * @abstract Resets all window positions. Defaults will be activated.
	 * 
	 * The defaults are taken from css file *dialog.css* (application css file).
	 */	
	resetWindowPositions() {
		this.transaction.begin();
		var css = new Css();

		for (const [key, val] of Object.entries(this)) {
			if (key.startsWith('w')) {
				var o = css.dimensionsOf(key);
				this[key] = o;
				$(`#${key}`).panel('resize', o);
			}
		}

		this.transaction.end();
	}
	
	/**
	 * @abstract Writes parameters to the HIDDEN field as required to return some values back
	 * 			 to the caller.
	 */
	writeParameters(equation = "") {
		var parameters = JSON.stringify(this.filteredParameters);
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
		var o = { };
		var doNotUse = [ "transaction", "displayMode" ];
		for (const [key, val] of Object.entries(this)) {
			if (!(key in doNotUse)) {
				o[key] = val;
			}
		}
		
		return o;
	}
	
	/**
	 * @abstract onPanelMove handler for some dialogs and windows.
	 */
	onPanelMove(id, left, top) {
		if (id in this && (this[id].left != left || this[id].top != top)) {
			this[id].left = left;
			this[id].top = top;
			
			// TODO: check
			//var dimensions = this.getPanelDimensions(id);
			//this[id].width = dimensions.width;
			//this[id].height = dimensions.height;
			
			this.transaction.complete();
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
		if (id in this && (this[id].width != width || this[id].height != height)) {
			this[id].width = width;
			this[id].height = height;
			
			var dimensions = this.getPanelDimensions(id);
			this[id].left = dimensions.left;
			this[id].top = dimensions.top;
			
			this.transaction.complete();
		}
	}
	
	/**
	 * @abstract Resizes a given panel by using the 'configured' settings.
	 * 
	 * @param id - the panel id as in HTML
	 */
	resizePanel(id) {
		if (id in this && this[id] != undefined) {
			try {
				var o = this[id];
				$(`#${id}`).panel('resize', this[id]);
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
		var options = $(`#${id}`).panel('options');
		var dimensions = { 
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
		for (const sheet of document.styleSheets) {
			if (sheet.href && sheet.href.endsWith('dialog.css')) {
				this.sheet = sheet;
				return;
			}
		}		
	}
	
	/**
	 * @abstract Searches for and retrieves the width and height given the window id.
	 * 
	 * @param id - the id of the window (id attribute)
	 * @returns object with width and height entries, returns *auto* if not found
	 */
	dimensionsOf(id) {
		for (const rule of this.sheet.cssRules) {
			if (rule.type == rule.STYLE_RULE && rule.selectorText === ('#' + id)) {
				const width = rule.styleMap.get('width');
				const height = rule.styleMap.get('height');
				return {
					width: width.value + width.unit,
					height: height.value + height.unit
				};
			}
		}
		return { width: 'auto', height: 'auto'};
	}
}
