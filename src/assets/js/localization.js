

class Localizer {
	
	current = null;
	fallback = null;
	locales = ['vi_VN', 'ar', 'de_DE', 'en_US', 'fr_FR', 'es_ES', 'ru'];
	currentLocale = 'en_US';
	location = "";
	
	constructor() {
		this.location = getScriptLocation();
	}
	
	async basicLoad(langCode) {
		var pathname = this.location;
		var langFile = `${pathname}/localization/${langCode}/lang.json`;
		var response = await fetch(langFile);
		return await response.json();
	}
	
	async load(langCode) {
		var inst = this;
		
		if (inst.fallback == null) {
			inst.fallback = await inst.basicLoad('en_US');
		}
		
		inst.current = await inst.basicLoad(langCode);
		console.info(`Read language file for ${langCode}`);
	}
	
	getLocalText(code) {
		if (this.current != null) {
			var text = this.current[code];
			if (text != undefined && text != '') return text;
		}
		if (this.fallback != null) {
			var text = this.fallback[code];
			if (text != undefined && text != '') return text;
		}
		
		return code;
	}
	
	async buildLocalTypes() {
		var html = "<fieldset dir='ltr'>"; 
		var inst = this;
		
		for (var lang of inst.locales) {
			var json = await inst.basicLoad(lang);			
			var langage = json["_i18n_Langage"]; 
			var langCode = json["_i18n_HTML_Lang"]; 
			var langDir = json["_i18n_HTML_Dir"]; 
			var langAuthor = json["_i18n_Author"]; 
			html += "\n\t<input type='radio' name='localType' id='" + lang + "_localType' value='" + lang + "' /> <label for='" + lang + "_localType' dir='" + langDir + "'><!--img src='js/i18n/icons/" + langCode + ".png' width='16' height='11' alt='" + langCode + "' / -->" + langage + "</label> - " + langAuthor + "<br />";
		}
		html += "\n</fieldset>";
		return html; 
	}
	
	async buildLocalResources() {
		var inst = this;

		for (var lang of inst.locales) {
			var json = await inst.basicLoad(lang);
			var title = lang; 
			var langage = json["_i18n_Langage"]; 
			if (!$('#tLANGUAGE_LIST').tabs('exists', title)) {
				var list = "<table border='1' cellspacing='0' style='border-spacing:0px;border-collapse:collapse;margin:20px;width:580px'>"; 
				var dir = json["_i18n_HTML_Dir"]; 
				for (var ressource in json) { 
					list += ("<tr><td valign='top'><b>" + ressource + "</b> : </td><td valign='top' class='rtl-align-right'" + ((dir == "rtl") ? "style='text-align:right;'" : "") + " dir='" + dir + "'>" + json[ressource].replace(/</gi, "&lt;") + "</td></tr>\n"); 
				}
				list += "</table>"; 
				$('#tLANGUAGE_LIST').tabs('add', { title: title, content: list, closable: false });
			}			
		}
	}
}
