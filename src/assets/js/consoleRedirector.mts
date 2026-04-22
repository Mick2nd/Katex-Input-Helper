import { IMessager } from './interfaces.mjs';


/**
 * Console calls are redirected to this class which in turn redirects them to
 * the messager.
 */
class Redirector {
	
	messager: IMessager = null;
	
	/**
	 * Constructor.
	 */
	constructor() {
		// Reserved.
		const consoleProps = [
			"assert", 
			"clear", 
			"count", 
			"debug", 
			"dir", 
			"dirxml", 
			"error", 
			"exception", 
			"group", 
			"groupCollapsed", 
			"groupEnd", 
			"info", 
			"log", 
			"markTimeline", 
			"profile", 
			"profileEnd", 
			"table", 
			"time", 
			"timeEnd", 
			"timeStamp", 
			"trace", 
			"warn"
		];
		for (const prop of consoleProps) {
			if (!(prop in this) && (prop in window.console)) {		// all missing methods are transferred to this instance
				this[prop] = window.console[prop];
			}
		}		
	}
	
	/**
	 * Meant for method injection.
	 */
	inject(messager: IMessager) {
		this.messager = messager;
		this.debug(`Messager injected`);
		this['assert'](this.messager !== null);
	}

	error(...params) {
		window.console.error(...params);
		this.messager.error(...params);
	}

	warn(...params) {
		window.console.warn(...params);
		this.messager.warn(...params);
	}

	info(...params) {
		window.console.info(...params);
		this.messager.info(...params);
	}
	
	debug(...params) {
		window.console.debug(...params);
		this.messager.debug(...params);
	}
}

const base = new Redirector();
export const redirector = base;

