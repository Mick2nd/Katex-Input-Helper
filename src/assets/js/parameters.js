

/**
 * Manages control parameters, especially those which can be stored over sessions.
 * Cookie handling is left here for reference.
 */
class Parameters {
	
	id = 'Katex Input Helper';
	equation = "";
	style = "aguas";
	localType = "en_US";
	equationCollection = { };
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
				if (key.startsWith('wf_')) {
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
	
	setCookie(name, value, days, path, domain, secure) {
		var expires = ""; 
		if (days) { 
			var date = new Date(); 
			date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000)); 
			expires = "; expires=" + date.toGMTString(); 
		}
		document.cookie = name + "=" + escape(value) + expires + ((path) ? "; path=" + path : "; path=/") + ((domain) ? "; domain=" + domain : "") + ((secure) ? "; secure" : "");
	}
	
	getCookie(name) {
		var nameEQ = name + "="; 
		var ca = document.cookie.split(';'); 
		var i, c; 
		for (i = 0; i < ca.length; i++) { 
			c = ca[i]; 
			while (c.charAt(0) == ' ') c = c.substring(1, c.length); 
			if (c.indexOf(nameEQ) == 0) return unescape(c.substring(nameEQ.length, c.length)); 
		}
		return null;
	}
	
	deleteCookie(name) { 
		this.setCookie(name, "", -1); 
	}

	/**
	 * This serves me to recognize the supported settings.
	 */
	saveCookies() { 
		if (this.saveOptionInCookies) { 
			this.setCookie("VME_codeType", this.codeType, 1000); 
			this.setCookie("VME_encloseAllFormula", this.encloseAllFormula, 1000); 
			this.setCookie("VME_saveOptionInCookies", this.saveOptionInCookies, 1000); 
			this.setCookie("VME_localType", this.localType, 1000); 
			this.setCookie("VME_style", this.style, 1000); 
			this.setCookie("VME_autoUpdateTime", this.autoUpdateTime, 1000); 
			this.setCookie("VME_menuupdateType", this.menuupdateType, 1000); 
			this.setCookie("VME_autoupdateType", this.autoupdateType, 1000); 
			this.setCookie("VME_menuMathjaxType", this.menuMathjaxType, 1000); 
		} else { 
			this.deleteCookie("VME_codeType"); 
			this.deleteCookie("VME_encloseAllFormula"); 
			this.deleteCookie("VME_saveOptionInCookies"); 
			this.deleteCookie("VME_localType"); 
			this.deleteCookie("VME_style"); 
			this.deleteCookie("VME_autoUpdateTime"); 
			this.deleteCookie("VME_menuupdateType"); 
			this.deleteCookie("VME_autoupdateType"); 
			this.deleteCookie("VME_menuMathjaxType"); 
			this.deleteCookie("VME_Position_wf_BRACKET_SYMBOLS_MORE"); 
			this.deleteCookie("VME_Position_wf_ARROW_SYMBOLS_MORE"); 
			this.deleteCookie("VME_Position_wf_RELATION_SYMBOLS_MORE"); 
			this.deleteCookie("VME_Position_wf_FR_CHAR_MORE"); 
			this.deleteCookie("VME_Position_wf_BBB_CHAR_MORE"); 
			this.deleteCookie("VME_Position_wf_L_U_GREEK_CHAR_MORE"); 
			this.deleteCookie("VME_Position_wf_ALL_CHAR_MORE"); 
			this.deleteCookie("VME_Position_wf_EQUATION_MORE"); 
			this.deleteCookie("VME_Position_wf_COMMUTATIVE_DIAGRAM_MORE"); 
			this.deleteCookie("VME_Position_wf_CHEMICAL_FORMULAE_MORE"); 
			this.deleteCookie("VME_Position_wf_HORIZONTAL_SPACING_MORE"); 
			this.deleteCookie("VME_Position_wf_VERTICAL_SPACING_MORE"); 
			this.deleteCookie("VME_Position_wf_SPECIAL_CHARACTER_MORE"); 
		} 
	}	
}
