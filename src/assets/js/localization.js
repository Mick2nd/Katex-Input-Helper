import { Observable } from "./patterns/observable";

/**
 * @abstract Supports the localization of this application.
 * 
 * This is an Observable as it recognizes the change of Language and notifies its observers.
 */
export class Localizer {
	
	current = null;
	fallback = null;
	locales = ['ar', 'de_DE', 'en_US', 'es_ES', 'fr_FR', 'ru', 'vi_VN'];
	currentLocale = 'en_US';
	observable = null;
	
	/**
	 * @abstract Constructor. The script location is queried as needed to locate the language files.
	 */
	constructor(observableCls = Observable) {
		this.observable = new observableCls();
	}
	
	/**
	 * @abstract Override of the Observable.
	 */
	subscribe(func, ...args) {
		this.observable.subscribe(func, ...args);
	}

	/**
	 * @abstract The basic load method. Reads a language file given by its language code.
	 */
	async basicLoad(langCode) {
		try {
			var json = await import(
				/* webpackInclude: /\.json$/ */
				`./localization/${langCode}/lang.json`);
			
			return json;
		} catch(e) {
			console.error(`Could not load language file - ${e}`);
			return { };
		}
	}
	
	/**
	 * @abstract The main load method.
	 * 
	 * Loads the fallback variant for en_US and the given languages language files and stores
	 * them in this instance. Notifies observers about this event.
	 */
	async load(langCode) {
		var inst = this;
		
		if (inst.fallback == null) {
			inst.fallback = await inst.basicLoad('en_US');
		}
		
		inst.current = await inst.basicLoad(langCode);
		inst.currentLocale = langCode;
		
		// ATTENTION! NOT EVERY LOCALE has a corresponding EASYUI LOCALE
		try {
			var shortCode = inst.current._i18n_HTML_Lang;
			await import(`./jquery-easyui/locale/easyui-lang-${shortCode}.js`);
		} catch(e) {
			console.warn(`${shortCode} : no corresponding easyui locale`);
		}
		
		await inst.observable.notifyAsync(inst);
		console.info(`Read language file for ${langCode}`);
	}
	
	/**
	 * @abstract Queries the languages version of some text given by its key(code).
	 */
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
	
	/**
	 * @abstract Initialises the **Language Choice** dialog.
	 * 
	 * This is a one time initialisation task
	 * 
	 * @param localType - the language code as de_DE or en_US
	 */
	async initialiseLanguageChoice(localType) {
		var inst = this;
		var html = await this.buildLocalTypes();
		$("#formLANGUAGE_CHOISE").html(html);
		$("[name='localType']").filter(`[value=${localType}]`).attr("checked", "checked"); 
		
		$("input[name='localType']").change(async function() { 
			var localType = $("input[name='localType']:checked").val(); 
			await inst.load(localType); 
		}); 

		await this.load(localType);
	}
	
	/**
	 * @abstract Assembles the content of the Language selection dialog using the existing language 
	 * 			 files.
	 */
	async buildLocalTypes() {
		var html = "<fieldset dir='ltr'>"; 
		var inst = this;
		
		for (var lang of inst.locales) {
			var json = await inst.basicLoad(lang);			
			var langage = json["_i18n_Langage"]; 
			var langCode = json["_i18n_HTML_Lang"]; 
			var langDir = json["_i18n_HTML_Dir"]; 
			var langAuthor = json["_i18n_Author"]; 
			var flag = langCode;
			if (langCode == 'en') { flag = 'us'; }
			
			var ico = await import(`./i18n/icons/${flag}.png`);
			
			html += 
				`\n\t` + 
				`<input type='radio' name='localType' id='${lang}_localType' value='${lang}' />` + 
				`<img src='./icons/${flag}.png' width='16' height='11' alt='${langCode}' /> &nbsp; ` + 
				`<label for='${lang}_localType' dir='${langDir}'>${langage}</label> - ${langAuthor} <br />`;
		}
		html += "\n</fieldset>";
		return html; 
	}
	
	/**
	 * @abstract Assembles the content of the Language Resources dialog.
	 */
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
					list += (
						"<tr><td valign='top'><b>" + ressource + "</b> : </td>" + 
						"<td valign='top' class='rtl-align-right'" + ((dir == "rtl") ? "style='text-align:right;'" : "") + " dir='" + dir + "'>" + json[ressource].replace(/</gi, "&lt;") + "</td></tr>\n"); 
				}
				list += "</table>"; 
				$('#tLANGUAGE_LIST').tabs('add', { title: title, content: list, closable: false });
			}			
		}
		$('#tLANGUAGE_LIST').tabs('select', inst.currentLocale);
	}
}

// This helps to import symbols in test suite
try {
	module.exports = { Localizer };
} catch(e) { }
