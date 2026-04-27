import { inject, injectable } from 'inversify';
import { ILocalizer, localizerId, IMessager, messagerId, IUtilities, State, IToggler } from './interfaces.mjs';
import { Observable } from './patterns/observable.mjs';
import { RegionToggler, ContainerToggler } from './toggler.mjs';

/**
 * Encapsulates the jquery messager with frequently used options and provides a
 * central place for user notifications.
 */
@injectable()
export class Messager extends Observable implements IMessager {
	
	localizer: ILocalizer;
	eventView: Event[] = [];
	max: number;
	
	/**
	 * Constructor, localizer is injected.
	 */
	constructor(
		@inject(localizerId) localizer: ILocalizer
	) {
		super();
		this.localizer = localizer;
		this.max = 100;
	}
	
	/**
	 * Displays an alert warning box.
	 * Provided messages key is translated, so you get a localized message.
	 */
	showError(msgKey: string, e: any) {
		let error = this.localizer.getLocalText('ERROR');
		let msg = this.localizer.getLocalText(msgKey);
		$.messager.alert(`<span class='rtl-title-withicon'>${error}</span>`, `${msg} - ${e}`, 'warning'); 		
	}
	
	/**
	 * Shows an Panel with some information or hints.
	 * Title key and Message key are translated.
	 */
	show(titleKey: string, msgKey: string, e = null) {
		const inst = this;
		const msgText = inst.localizer.getLocalText(msgKey);
		const titleText = inst.localizer.getLocalText(titleKey);

		const title = `<span class='rtl-title-withicon'>${titleText}</span>`;
		let msg = msgText;
		if (e != null) {
			msg = `<div>${msg}:</div><div style="color: red;">${e}</div>`;
		}
		
		this.push(new Event(titleText, msgText, e));
		$.messager.show({ title: title, msg: msg });
	}
	
	/**
	 * The error hook from console. This stores an error in the Event view for 
	 * later inspection.
	 */
	error(...params: any[]) : void {
		if (params.length == 2) {
			const [ msg, e ] = params;
			this.push(new Event('LOG_ERROR', msg.splice(0, -2), e));
		}
		if (params.length == 1) {
			const [ msg ] = params;
			this.push(new Event('LOG_ERROR', msg, null));
		}
	}
	warn(...params) : void {
		
	}
	info(...params) : void {
		
	}
	debug(...params) : void {
		
	}
	
	/**
	 * Pushs an Event to the eventView by limiting the total length.
	 */
	push(item: Event) {
		this.eventView.push(item);
		if (this.eventView.length > this.max) {
			this.eventView.shift();
		}
		
		this.notify(this);
	}
	
	/**
	 * Gets a table out of the eventView
	 */
	get table() : string {
		
		let table = '<table cellspacing="0" class="events-table">\n';
		table += this.head;
		for (const event of this.eventView.toReversed()) {
			table += event.row;
		}
		table += '</table>\n';
		return table;
	}
	
	localize(key: string) : string {
		return this.localizer.getLocalText(key);
	}

	get head() : string {
		const time = this.localize('TIME') + ' (UTC, ISO)';
		const title = this.localize('TITLE');
		const message = this.localize('MESSAGE');
		const exception = this.localize('EXCEPTION');
		
		return `<tr><th>${time}</th><th>${title}</th><th>${message}</th><th>${exception}</th></tr>\n`;
	}
}


/**
 * A messager notification or log event, to be used in an event view.
 */
class Event {
	
	time: Date;
	title: string;
	msg: string;
	e: Error;
	
	constructor(title: string, msg: string, e: Error = null) {
		this.time = new Date(Date.now());
		this.title = title;
		this.msg = msg;
		this.e = e;
	}
	
	get exception() : string {
		if (this.e) {
			return `${this.e}`;
		}
		return '';
	}
	
	get formattedTime() : string {
		return this.time.toISOString().replace('T', ' ').replace('Z', '');
	}
	
	get row() : string {
		return `<tr><td>${this.formattedTime}</td><td>${this.title}</td><td>${this.msg}</td><td>${this.exception}</td></tr>\n`;
	}
}


/**
 * A Utilities class.
 */
@injectable()
export class Utilities implements IUtilities {
	messager: IMessager;
	localizer: ILocalizer;
		
	/**
	 * Constructor, localizer is injected.
	 */
	constructor(
		@inject(localizerId) localizer: ILocalizer,
		@inject(messagerId) messager: IMessager
	) {
		this.localizer = localizer;
		this.messager = messager;
	}
	
	/**
	 * Loads a formula file from the 'formulas' folder.
	 * 
	 * @param panelId - the id of the panel
	 * @returns the loaded HTML from the file
	 */
	async loadFormula(panelId: string) : Promise<string> {
		try {
			const html = (await import(
				/* webpackInclude: /\.html$/ */ 
				`../formulas/${panelId}.html`)).default;

			this.messager.show('SYMBOL_PANEL_LOADED', panelId);
			console.info(`Loaded symbol panel ${panelId}`);
			return html;

		} catch(e) {
			this.messager.show('ERROR_LOADING_SYMBOL_PANEL', panelId, e);
			console.error(`Error loading symbol panel ${panelId} : %s`, e);
			return "";
		}
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
	 * @param state - the start state
	 */
	regionToggler(btnId: string, layout: string, state: State) : IToggler {
		const toggler = new RegionToggler(this);
		toggler.initialize({id: btnId, layout: layout, state: state});
		return toggler;
	}
	
	/**
	 * The container toggler factory method. Equips a button and a container element
	 * with toggle functionality.
	 * 
	 * @param btnId -  the id selector of the button
	 * @param uiId - a view id selector
	 * @param startState - the start state (true for active)
	 */
	containerToggler(btnId: string, uiId: string, startState: boolean) : IToggler {
		const toggler = new ContainerToggler(this);
		toggler.initialize({ id: btnId, view: uiId, state: startState });
		return toggler;
	}
}


// This helps to import symbols in test suite
try {
	module.exports = { Messager, Utilities };
} catch(e) { }
