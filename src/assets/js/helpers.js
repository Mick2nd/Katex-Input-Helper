
class Messager {
	localizer = null;
	
	constructor(localizer) {
		this.localizer = localizer;
	}
	
	error(msgKey, e) {
		var error = this.localizer.getLocalText('ERROR');
		var msg = this.localizer.getLocalText(msgKey);
		$.messager.alert(`<span class='rtl-title-withicon'>${error}</span>`, `${msg} - ${e}`, 'warning'); 		
	}
	
	show(titleKey, msgKey, e = null) {
		var inst = this;
		var msg = inst.localizer.getLocalText(msgKey);
		if (e != null) {
			msg = `<div>${msg}:</div><div style="color: red;">${e}</div>`;
		}
		$.messager.show({
			title: `<span class='rtl-title-withicon'>${inst.localizer.getLocalText(titleKey)}</span>`,
			msg: msg
		});
	}
}

class Utilities {
	localizer = null;
		
	constructor(localizer) {
		this.localizer = localizer;
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
	localizeOption(id, option) {
		var text = $(`#${id}`).window('options')[option];								// do something to preserve the TITLE: this is a option
		var html = $.parseHTML(text);													// parse it into html object
		var key = $(html).attr('locate');												// extract the locate attribute
		var located = this.localizer.getLocalText(key);									// use it to get localized text
		html = $(html).html(located)[0].outerHTML;										// insert it into orginal html
	
		return html;
	}		
}
