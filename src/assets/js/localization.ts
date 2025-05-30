import { injectable } from 'inversify';
import { ILocalizer } from './interfaces';
import { Observable } from "./patterns/observable";

/**
 * Supports the localization of this application.
 * 
 * This uses an Observable as it recognizes the change of Language and notifies its observers.
 */
@injectable()
export class Localizer implements ILocalizer {
	
	current = null;
	fallback = null;
	locales = ['ar', 'de_DE', 'en_US', 'es_ES', 'fr_FR', 'ru', 'vi_VN'];
	currentLocale = 'en_US';
	observable = null;
	
	/**
	 * Constructor. The script location is queried as needed to locate the language files.
	 */
	constructor(observableCls = Observable) {
		this.observable = new observableCls();
	}
	
	/**
	 * Override of the Observable.
	 */
	subscribe(func: any, ...args: any) {
		this.observable.subscribe(func, ...args);
	}

	/**
	 * The basic load method. Reads a language file given by its language code.
	 */
	async basicLoad(langCode: string) {
		try {
			let json = await import(
				/* webpackInclude: /\.json$/ */
				`./localization/${langCode}/lang.json`);
			
			if ('default' in json) {								// workaround: sometimes no json is imported
				json = json['default'];
			}
			return json;
		} catch(e) {
			console.error(`Could not load language file - ${e}`);
			return { };
		}
	}
	
	/**
	 * The main load method.
	 * 
	 * Loads the fallback variant for en_US and the given languages language files and stores
	 * them in this instance. Notifies observers about this event.
	 */
	async load(langCode: string) {
		let inst = this;
		
		if (inst.fallback == null) {
			inst.fallback = await inst.basicLoad('en_US');
		}
		
		inst.current = await inst.basicLoad(langCode);
		inst.currentLocale = langCode;
		
		// ATTENTION! NOT EVERY LOCALE has a corresponding EASYUI LOCALE
		let shortCode = "";
		try {
			shortCode = inst.current._i18n_HTML_Lang;
			await import(`./jquery-easyui/locale/easyui-lang-${shortCode}.js`);
		} catch(e) {
			console.warn(`${shortCode} : no corresponding easyui locale`);
		}
		
		await inst.observable.notifyAsync(inst);
		console.info(`Read language file for ${langCode}`);
	}
	
	/**
	 * Queries the languages version of some text given by its key(code).
	 */
	getLocalText(code: string) {
		if (this.current != null) {
			let text = this.current[code];
			if (text != undefined && text != '') return text;
		}
		if (this.fallback != null) {
			let text = this.fallback[code];
			if (text != undefined && text != '') return text;
		}
		
		return code;
	}
	
	/**
	 * Initialises the **Language Choice** dialog.
	 * 
	 * This is a one time initialisation task
	 * 
	 * @param localType - the language code as de_DE or en_US
	 */
	async initialiseLanguageChoice(localType: string) {
		let inst = this;
		let html = await this.buildLocalTypes();
		$("#formLANGUAGE_CHOISE").html(html);
		$("[name='localType']").filter(`[value=${localType}]`).attr("checked", "checked"); 
		
		$("input[name='localType']").on('change', async function() { 
			let localType = $("input[name='localType']:checked").val() as string; 
			await inst.load(localType); 
		}); 

		await this.load(localType);
	}
	
	/**
	 * Assembles the content of the Language selection dialog using the existing language 
	 * files.
	 */
	async buildLocalTypes() {
		let html = "<fieldset dir='ltr'>"; 
		let inst = this;
		
		for (let lang of inst.locales) {
			let json = await inst.basicLoad(lang);			
			let langage = json["_i18n_Langage"]; 
			let langCode = json["_i18n_HTML_Lang"]; 
			let langDir = json["_i18n_HTML_Dir"]; 
			let langAuthor = json["_i18n_Author"]; 
			let flag = langCode;
			if (langCode == 'en') { flag = 'us'; }
			
			let ico = await import(`./i18n/icons/${flag}.png`);
			
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
	 * Assembles the content of the Language Resources dialog.
	 */
	async buildLocalResources() {
		let inst = this;

		for (let lang of inst.locales) {
			let json = await inst.basicLoad(lang);
			let title = lang; 
			let langage = json["_i18n_Langage"]; 
			if (!$('#tLANGUAGE_LIST').tabs('exists', title)) {
				let list = "<table border='1' cellspacing='0' style='border-spacing:0px;border-collapse:collapse;margin:20px;width:580px'>"; 
				let dir = json["_i18n_HTML_Dir"]; 
				for (let ressource in json) { 
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
