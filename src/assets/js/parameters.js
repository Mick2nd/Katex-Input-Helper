

/**
 * Manages control parameters, especially those which can be stored over sessions.
 * Cookie handling is left here for reference.
 */
class Parameters {
	
	id = 'Katex Input Helper';
	equation = "";
	style = "aguas";
	localType = "en_US";
	equationCollection = [ ];
	dialogSettingsPrefix = "KIH_Location_";
	
	constructor() {
	}
	
	async queryParameters() {
		var inst = this;
		var response = await webviewApi.postMessage({
			id: this.id,
			cmd: 'getparams'
		});
		console.info(`Parameters: ${JSON.stringify(response)}`);
		if (response) {
			for (const [key, val] of Object.entries(response)) {
				inst[key] = val;
				if (key.startsWith('w')) {
					this.resizePanel(key);
				}
			}

			inst.writeParameters();
		} 
	}
	
	writeParameters(equation = "") {
		if (equation != "") {
			this.equation = equation;
		}
		var parameters = JSON.stringify(this);
		$('#hidden').attr('value', parameters);
		console.info(`Parameters as written to HIDDEN field : ${parameters}`);
	}
	
	onPanelMove(id, left, top) {
		if (id in this) {
			this[id].left = left;
			this[id].top = top;
			this.writeParameters();
		}
	}
	
	onPanelResize(id, width, height) {
		if (id in this) {
			this[id].width = width;
			this[id].height = height;
			this.writeParameters();
		}
	}
	
	resizePanel(id) {
		if (id in this) {
			$(`#${id}`).panel('resize', this[id]);
		}
	}
}
