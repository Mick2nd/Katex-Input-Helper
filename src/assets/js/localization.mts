import { injectable } from 'inversify';
import { ILocalizer } from './interfaces.mjs';
import { Observable } from './patterns/observable.mjs';

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
	resolvers: any[] = [];
	localeData = { };
	scrollPos = 0;
	
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
	 * Notifies observers of this instance.
	 */
	notify() {
		this.observable.notify(this);
	}

	/**
	 * The basic load method. Reads a language file given by its language code.
	 */
	async basicLoad(langCode: string) {
		try {
			if (!(langCode in this.localeData)) {
				let json = await import(
					/* webpackInclude: /\.json$/ */
					`./localization/${langCode}/lang.json`);

				if ('default' in json) {								// workaround: sometimes no json is imported
					json = json['default'];
				}
				
				this.localeData[langCode] = json;
			}
			return this.localeData[langCode];
		} catch(e) {
			console.error(`Could not load language file - %s`, e);
			throw(e);
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
		
		inst.fallback ??= await inst.basicLoad('en_US');
		
		inst.current = await inst.basicLoad(langCode);
		inst.currentLocale = langCode;
		
		// ATTENTION! NOT EVERY LOCALE has a corresponding EASYUI LOCALE
		let shortCode = "";
		try {
			shortCode = inst.current._i18n_HTML_Lang;
			if (shortCode == 'vi') {
				shortCode = 'en';				// fallback for Vietnam
			}
			await import(`./jquery-easyui/locale/easyui-lang-${shortCode}.js`);
		} catch(e) {
			console.warn(`${shortCode} : no corresponding easyui locale`);
		}
		
		console.info(`Read language file for ${langCode}`);
		$('#tLANGUAGE_LIST').tabs('select', langCode);
		await inst.observable.notifyAsync(inst);
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
		for (const resolver of this.resolvers) {
			let text = resolver(code);
			if (text != undefined && text != '') return text;
		}
		
		return code;
	}
	
	/**
	 * Adds an additional external resolver for keys.
	 */
	addResolver(func: any) {
		this.resolvers.push(func);
	}
	
	/**
	 * Initialises the **Language Choice** dialog.
	 * This is a one time initialisation task
	 * 
	 * @param localType - the language code as de_DE or en_US
	 */
	async initialiseLanguageChoice(localType: string) {
		const preparedLocalType = (localType === '' ? 'en_US' : localType);
		const inst = this;
		const html = await this.buildLocalTypes();
		$("#formLANGUAGE_CHOISE").html(html);
		$("[name='localType']").filter(`[value=${preparedLocalType}]`).attr("checked", "checked"); 
		
		$("input[name='localType']").on('change', async function() { 
			const localType = $("input[name='localType']:checked").val() as string; 
			await inst.load(localType); 
		}); 

		await this.load(preparedLocalType);
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
				`\n\t<div>` + 
				`<input type='radio' name='localType' id='${lang}_localType' value='${lang}' />` + 
				`<img src='./icons/${flag}.png' alt='${langCode}' />` + 
				`<label for='${lang}_localType' dir='${langDir}'>${langage} - ${langAuthor}</label> </div>`;
		}
		html += "\n</fieldset>";
		return html; 
	}
	
	/**
	 * Assembles the content of the Language Resources dialog.
	 */
	async buildLocalResources(clear: boolean = false) {
		let inst = this;

		if (clear) {
			const tabs = $('#tLANGUAGE_LIST').tabs('tabs');			// clear existing tabs
			for (let i = tabs.length - 1; i >= 0; i--) {
				$('#tt').tabs('close', i);
			}
		}
		
		for (let lang of inst.locales) {
			let json = await inst.basicLoad(lang);
			let title = lang; 
			let langage = json["_i18n_Langage"]; 
			if (!$('#tLANGUAGE_LIST').tabs('exists', title)) {
				let list = "<table border='1' cellspacing='0' class='resources-table' >"; 
				let dir = json["_i18n_HTML_Dir"]; 
				let dirStyle = ((dir == "rtl") ? "style='text-align:right;'" : "");
				for (let ressource in json) {
					let encodedResourceValue = json[ressource].replace(/</gi, "&lt;");
					list += (
						`<tr>
							<td valign='top'><b>${ressource}</b>: </td>
							<td valign='top' class='rtl-align-right' ${dirStyle} dir='${dir}'>${encodedResourceValue}</td>
						</tr>\n`); 
				}
				list += "</table>"; 
				$('#tLANGUAGE_LIST').tabs('add', { title: title, content: list, closable: false });
			}			
		}
		console.info(`Language Resources loaded, locale is : ${inst.currentLocale}`);
		$('#tLANGUAGE_LIST').tabs('select', inst.currentLocale);
		
		this.activateSynchronization();
	}
	
	/**
	 * Synchronization feature between the several tabs' scroll positions.
	 */
	activateSynchronization() {
		const inst = this;
		$(`#tLANGUAGE_LIST .panel .panel-body`).on('scroll', function() {
			const scrollPos = this.scrollTop;
			inst.scrollPos = scrollPos;
		});

		$('#tLANGUAGE_LIST').tabs({
			onSelect: function(title: string, idx: number) {
				$(`#tLANGUAGE_LIST .panel:nth-child(${idx + 1}) .panel-body`).scrollTop(inst.scrollPos);
			}
		})
	}
}

// This helps to import symbols in test suite
try {
	module.exports = { Localizer };
} catch(e) { }
