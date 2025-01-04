

/**
 * @abstract Manages control parameters, especially those which can be stored over sessions.
 */
class Parameters {
	
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
	
	/**
	 * @abstract Returns a Proxy of the original class intercepting write access.
	 */
	constructor() {
		return new Proxy(
			this,
			{
				set(target, prop, value, receiver) {
					var changed = target[prop] != value;
					if (changed) {
						target[prop] = value;
						if (!target.blockWrite) {
							console.debug(`property set 1: ${prop} = ${value}`);
							console.debug(`property set 2: ${target[prop]}`);
							target.writeParameters();
						}
					}
					return true;
				}
			});
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
		console.debug(`Parameters: ${JSON.stringify(response)}`);
		if (response) {
			inst.blockWrite = true;
			for (const [key, val] of Object.entries(response)) {
				inst[key] = val;
				if (key.startsWith('w')) {
					this.resizePanel(key);
				}
			}

			inst.blockWrite = false;
			// Initiated by previous set?
			// inst.writeParameters();
		} 
	}
	
	/**
	 * @abstract Writes parameters to the HIDDEN field as required to return some values back
	 * 			 to the caller.
	 */
	writeParameters(equation = "") {
		if (equation != "") {
			this.equation = equation;
		}
		var parameters = JSON.stringify(this);
		$('#hidden').attr('value', parameters);
		console.debug(`Parameters as written to HIDDEN field : ${parameters}`);
	}
	
	/**
	 * @abstract onPanelMove handler for some dialogs and windows.
	 */
	onPanelMove(id, left, top) {
		if (id in this && (this[id].left != left || this[id].top != top)) {
			this[id].left = left;
			this[id].top = top;
			this.writeParameters();
		}
	}
	
	/**
	 * @abstract onPanelResize handler for some dialogs and windows.
	 */
	onPanelResize(id, width, height) {
		if (id in this && (this[id].width != width || this[id].height != height)) {
			this[id].width = width;
			this[id].height = height;
			this.writeParameters();
		}
	}
	
	/**
	 * @abstract Resizes a given panel
	 * 
	 * @param id - the panel id as in HTML
	 */
	resizePanel(id) {
		if (id in this && this[id] != undefined) {
			try {
				var o = this[id];
				console.debug(`Check point 1 : ${o.left} `);
				$(`#${id}`).panel('resize', this[id]);
			} catch(e) {
				console.error(`Exception resizing panel ${id} : ${e}`);
				this[id] = { left: 100, top: 100, width: 200, height: 200 };
				this.writeParameters();
			}
		}
	}
}
