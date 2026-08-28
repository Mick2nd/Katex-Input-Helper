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
			if (!(prop in this) && (prop in globalThis.console)) {		// all missing methods are transferred to this instance
				this[prop] = globalThis.console[prop];
			}
		}		
	}
	
	/**
	 * Meant for method injection.
	 */
	inject(messager: IMessager) {
		this.messager = messager;
		this.debug(`Messager injected`);
		if (this['assert'] !== undefined) {
			globalThis.console.assert(this.messager !== null);
		}
	}

	error(...params) {
		globalThis.console.error(...params);
		if (this.messager) { this.messager.error(...params); }
	}

	warn(...params) {
		globalThis.console.warn(...params);
		if (this.messager) { this.messager.warn(...params); }
	}

	info(...params) {
		globalThis.console.info(...params);
		if (this.messager) { this.messager.info(...params); }
	}
	
	debug(...params) {
		globalThis.console.debug(...params);
		if (this.messager) { this.messager.debug(...params); }
	}
}

const base = new Redirector();
export const redirector = base;

