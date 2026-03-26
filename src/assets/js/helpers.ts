import { inject, injectable } from 'inversify';
import { ILocalizer, localizerId, IMessager, IUtilities, State } from './interfaces';

/**
 * Encapsulates the jquery messager with frequently used options.
 */
@injectable()
export class Messager implements IMessager {
	
	localizer: ILocalizer;
	
	/**
	 * Constructor, localizer is injected.
	 */
	constructor(
		@inject(localizerId) localizer: ILocalizer
	) {
		this.localizer = localizer;
	}
	
	/**
	 * Displays an alert warning box.
	 * 
	 * Provided messages key is translated, so you get a localized message.
	 */
	error(msgKey: string, e: any) {
		let error = this.localizer.getLocalText('ERROR');
		let msg = this.localizer.getLocalText(msgKey);
		$.messager.alert(`<span class='rtl-title-withicon'>${error}</span>`, `${msg} - ${e}`, 'warning'); 		
	}
	
	/**
	 * Shows an Panel with some information or hints.
	 * 
	 * Title key and Message key are translated.
	 */
	show(titleKey: string, msgKey: string, e = null) {
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
 * A Utilities class.
 */
@injectable()
export class Utilities implements IUtilities {
	localizer: ILocalizer;
		
	/**
	 * Constructor, localizer is injected.
	 */
	constructor(
		@inject(localizerId) localizer: ILocalizer
	) {
		this.localizer = localizer;
	}
	
	/**
	 * Gets an option.
	 * 
	 * This extracts the option without translating it.
	 * 
	 * @param id - the id of the object, can be a window
	 * @param option - the option name
	 * @returns the changed option as html string
	 */
	getOption(id: string, option: string) : string {
		let text = $(`#${id}`).window('options')[option];
		return text;		
	}

	/**
	 * Used to localize an option.
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
		let key = $(html).attr('locate') as string;										// extract the locate attribute
		let located = this.localizer.getLocalText(key);									// use it to get localized text
		// TODO: after change due to Typescript errors all seems to be okay
		let htmlString = (($(html).html(located)[0] as any) as Element).outerHTML;		// insert it into orginal html
	
		return htmlString;
	}
	
	/**
	 * The region toggler factory method. Equips a button and a region in a layout
	 * with toggle functionality.
	 * 
	 * @param btnId -  the id selector of the button
	 * @param layout - a layout id selector
	 * @param region - the region identifier
	 * @param firstIcon - the text of the button
	 * @param secondIcon - the text of the button
	 */
	regionToggler(btnId: string, layout: string, state: State) : any {
		return new RegionToggler(btnId, layout, state, this);
	}
	
	/**
	 * The container toggler factory method. Equips a button and a container element
	 * with toggle functionality.
	 * 
	 * @param btnId -  the id selector of the button
	 * @param uiId - a container id selector
	 * @param region - the region identifier
	 * @param firstIcon - the text of the button
	 * @param secondIcon - the text of the button
	 */
	containerToggler(btnId: string, uiId: string, startState: boolean) : any {
		return new ContainerToggler(btnId, uiId, startState, this);
	}
}


/**
 * This class implements a toggle button for the Custom Equations dialog. It
 * toggles the Categories region on and of.
 */
class RegionToggler {
	
	id: string;
	layout: string;
	state: State;
	parent: any;

	firstRegion = "west";
	firstIcon: string;
	secondIcon: string;
	
	/**
	 * @constructor
	 * 
	 * @param id - the id of the button
	 * @param layout - the layout containing the region
	 * @param startState - the initial state
	 */
	constructor(id: string, layout: string, startState: State, parent: any) {
		
		this.id = id;
		this.layout = layout;
		this.state = startState;
		this.parent = parent;
		this.firstIcon = '&#x2770;';
		this.secondIcon = '&#x2771;';
		
		this.addResolver();

		this.toggle();
		
		let inst = this;
		$(this.id).on('click', function(event) {
			event.preventDefault();
			inst.state = inst.switchState();
			inst.toggle();
		});
	}
	
	/**
	 * Toggle between Categories ON and OFF and BOTH states.
	 */
	toggle() {
		let width = "";
		let text = "";
		
		switch(this.state) {
			case State.First:
				width = "100%";
				text = this.firstIcon + "&nbsp;" + this.secondIcon;
				break;
			case State.Both:
				width = "30%";
				text = this.firstIcon;
				break;
			case State.Second:
				width = "0%";
				text = this.secondIcon;
		}
		$(this.layout).layout('panel', this.firstRegion).panel('resize', { width: width });
		$(this.layout).layout('resize');		

		$(this.id).html(text);
		this.parent.localizer.notify();						// updates the tooltip text
	}
	
	/**
	 * Adds a resolver to the Localizer instance.
	 */
	addResolver() {
		this.parent.localizer.addResolver(this.resolver.bind(this));
	}
	
	/**
	 * The resolver used to dynamically update the tooltip.
	 */
	resolver(key: string) : string | undefined {
		if (key == "TTREGION") {
			switch(this.switchState()) {
				case State.First:
					return this.parent.localizer.getLocalText("TTREGION_FIRST");
				case State.Second:
					return this.parent.localizer.getLocalText("TTREGION_SECOND");
				case State.Both:
					return this.parent.localizer.getLocalText("TTREGION_BOTH");
			}
		}
		return "";
	}
	
	/**
	 * Cyclicly switches between Both - Second - First states;
	 */
	switchState() : State {
		switch(this.state) {
			case State.First:
				return State.Both;
			case State.Both:
				return State.Second;
		}
		return State.First;
	}
}


/**
 * Used to toggle the Unicode list in the Unicode window between hidden and block
 * view.
 */
class ContainerToggler {
	
	btnId: string;
	uiId: string;
	firstIcon: string;
	secondIcon: string;
	active: boolean = true;
	parent: any;
	
	/**
	 * @constructor
	 * 
	 * @param btnId - id of the toggle button
	 * @param uiId - id of the view to toggle OFF and ON
	 * @param startState - the start state (true for active)
	 */
	constructor(btnId: string, uiId: string, startState: boolean, parent: any) {
		this.btnId = btnId;
		this.uiId = uiId;
		this.active = startState;
		this.parent = parent;
		this.firstIcon = '&#x2770;';
		this.secondIcon = '&#x2771;';
		
		this.addResolver();
		this.toggle();
		
		let inst = this;
		$(this.btnId).on('click', function(event) {
			event.preventDefault();
			inst.active = !inst.active;
			inst.toggle();
		});
	}
	
	/**
	 * The toggle method.
	 */
	toggle() {
		
		$(this.uiId)
		.css('display', this.active ? 'inline-block' : 'none');
		$(this.btnId).html(this.active ? this.secondIcon : this.firstIcon);
		this.parent.localizer.notify();						// updates the tooltip text
	}

	/**
	 * Adds a resolver to the Localizer instance.
	 */
	addResolver() {
		this.parent.localizer.addResolver(this.resolver.bind(this));
	}
	
	/**
	 * The resolver used to dynamically update the tooltip.
	 */
	resolver(key: string) : string | undefined {
		if (key == "TTCONTAINER") {
			if (this.active) {
				return this.parent.localizer.getLocalText("TTCONTAINER_DEACTIVATE");
			} else {
				return this.parent.localizer.getLocalText("TTCONTAINER_ACTIVATE");
			}
		}
		return "";
	}
}


// This helps to import symbols in test suite
try {
	module.exports = { Messager, Utilities };
} catch(e) { }
