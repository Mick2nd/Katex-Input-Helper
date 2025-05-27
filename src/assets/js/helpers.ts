
/**
 * @abstract Encapsulates the jquery messager with frequently used options.
 */
export class Messager {
	localizer = null;
	
	/**
	 * @abstract Constructor, localizer is injected.
	 */
	constructor(localizer) {
		this.localizer = localizer;
	}
	
	/**
	 * @abstract Displays an alert warning box.
	 * 
	 * Provided messages key is translated, so you get a localized message.
	 */
	error(msgKey, e) {
		let error = this.localizer.getLocalText('ERROR');
		let msg = this.localizer.getLocalText(msgKey);
		$.messager.alert(`<span class='rtl-title-withicon'>${error}</span>`, `${msg} - ${e}`, 'warning'); 		
	}
	
	/**
	 * @abstract Shows an Panel with some information or hints.
	 * 
	 * Title key and Message key are translated.
	 */
	show(titleKey, msgKey, e = null) {
		let inst = this;
		let msg = inst.localizer.getLocalText(msgKey);
		if (e != null) {
			msg = `<div>${msg}:</div><div style="color: red;">${e}</div>`;
		}
		$.messager.show({
			title: `<span class='rtl-title-withicon'>${inst.localizer.getLocalText(titleKey)}</span>`,
			msg: msg
		});
	}
}


/**
 * @abstract A Utilities class.
 */
export class Utilities {
	localizer = null;
		
	/**
	 * @abstract Constructor, localizer is injected.
	 */
	constructor(localizer) {
		this.localizer = localizer;
	}
	
	/**
	 * @abstract Gets an option.
	 * 
	 * This extracts the option without translating it.
	 * 
	 * @param id - the id of the object, can be a window
	 * @param option - the option name
	 * @returns the changed option as html string
	 */
	getOption(id, option) {
		let text = $(`#${id}`).window('options')[option];
		return text;		
	}

	/**
	 * @abstract Used to localize an option.
	 * 
	 * The option is part of a bigger **easyui** object like dialog, panel, window. Originally it
	 * was meant to change the **title** of an object because that object was newly created in code.
	 * 
	 * @param id - the id of the object, can be a window
	 * @param option - the option name
	 * @returns the changed option as html string
	 */	
	localizeOption(id: string, option: string) : string {
		let text = $(`#${id}`).window('options')[option];								// do something to preserve the TITLE: this is an option
		let html = $.parseHTML(text);													// parse it into html object
		let key = $(html).attr('locate');												// extract the locate attribute
		let located = this.localizer.getLocalText(key);									// use it to get localized text
		// TODO: after change due to Typescript errors all seems to be okay
		let htmlString = (($(html).html(located)[0] as any) as Element).outerHTML;		// insert it into orginal html
	
		return htmlString;
	}		
}

// This helps to import symbols in test suite
try {
	module.exports = { Messager, Utilities };
} catch(e) { }
