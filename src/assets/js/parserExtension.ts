import { injectable } from 'inversify';
import { IParser } from './interfaces';

/**
 * A the jquery parser using parser wrapper.
 * 
 * To be preferred : the asynchronous version with xxxAsync.
 */
@injectable()
export class ParserExtension implements IParser {
	queue = [];
	item = null;
	async = false;
	completeCount = 0;
	fatalError = null;
	
	/**
	 * Constructor
	 * 
	 * @param async - to be true if async mode is used (preferred)
	 */
	constructor(async = true) {
		this.async = async;
	}
	
	/**
	 * The inititialization method
	 */
	initialise() {
		let inst = this;
		try {
			if (!inst.async) {
				$.parser.onComplete = function(ctx) {
					inst.onComplete(ctx);
					inst.next(ctx);
				}
			} else {
				$.parser.onComplete = function(ctx) {
					inst.onCompleteAsync(ctx);
					inst.nextAsync(ctx);
				}
			}
		} catch(e) {
			console.error(`Fatal Error: jquery not loaded ${e}`);
			this.fatalError = e;
			throw(e);
		}
	}
	
	/**
	 * Parses object(s) for given selector.
	 * 
	 * This method returns a Promise, e.g. is able to wait for the result of the call to become
	 * ready.
	 * 
	 * @param selector - the selector
	 * @param ctx - a context parameter
	 * @param delay - an optional delay (to be applied after the parser becomes ready)
	 * @returns the Promise
	 */
	async parseAsync(selector: string, ctx: any, delay = 0) {
		try {
			let item = {
				ctx: ctx,
				delay: delay,
				selector: selector,
				promise: null,
				onComplete: null
			};
			this.queue.push(item);
			this.nextAsync(ctx);
			item.promise = promisify(this, this.startParseAsync);
			
			return item.promise;
		} catch(err) {
			Promise.reject(err);
		}
	}
	
	/**
	 * Retrieves the next selector in the queue.
	 */
	nextAsync(ctx: any) {
		try {
			let item = this.queue.shift();
			this.item = item;
		} catch(e) {
			console.warn(`nextAsync without queued item for ${ctx} : ${this}`);
			this.item = null;
		}
	}
	
	/**
	 * Executes the prepared selector.
	 */
	startParseAsync(cb: any) {
		this.item.onComplete = cb;
		$.parser.parse(this.item.selector);			
	}

	/**
	 * The central completion routine.
	 */
	onCompleteAsync(ctx: any) {
		this.completeCount ++;
		if (typeof ctx != "string") {
			console.warn(`onCompleteAsync for external source - not handled.`);
			return;
		}
		let item = this.item;
		if (item != null) {
			console.info(`onCompleteAsync for ${ctx}: ${this}`);
			this.item = null;
			if (item.delay > 0) {
				let timer = setInterval(
					() => {
						item.onComplete(null, item.ctx);
						clearInterval(timer);
					},
					item.delay);
			} else {
				item.onComplete(null, item.ctx);
			}
		} else {
			console.warn(`onCompleteAsync for ${ctx} without active item: ${this}`);
		}
	}
	
	
	parse(selector: string, ctx: any, onComplete: any, delay = 0) {
		this.queue.push({
			selector: selector,
			onComplete: onComplete,
			ctx: ctx,
			delay: delay
		});
		console.info(`Parse after pushing: ${this}`);
		this.next(ctx);
	}
	
	next(ctx: any) {
		try {
			let item = this.queue.shift();
			this.item = item;
			$.parser.parse(item.selector);			
		} catch(e) {
			console.warn(`next without queued item: ${this}`);
			this.item = null;
		}
	}
	
	onComplete(ctx: any) {
		let item = this.item;
		if (item != null) {
			console.info(`onComplete: ${this}`);
			this.item = null;
			if (item.delay > 0) {
				let timer = setInterval(
					() => {
						item.onComplete(item.selector, item.ctx);
						clearInterval(timer);
					},
					item.delay);
			} else {
				item.onComplete(item.selector, item.ctx);
			}
		} else {
			console.warn(`onComplete without active item: ${this}`);
		}
	}
	
	toString() {
		return `Diagnostic info: number: ${this.completeCount}, active item: ${JSON.stringify(this.item)}, queue: ${JSON.stringify(this.queue)}`;
	}
}

	
/**
 * Converts a method with given signature and callback to a Promise returning method
 * 
 * @param ob - an object to be bound to the function parameter
 * @param fnc - a function object to be invoked
 * @param args - args of the function. The function has one additional callback parameter
 * @returns the Promise, will be fulfilled if the callback is invoked
 */
export async function promisify(ob: any, fnc: any, ...args: any)
{
	return new Promise((resolve, reject) =>
	{			
		fnc.bind(ob)(...args, (err: any, result: any) => {
			
		if (err)
		{
			console.error('Error occurred: ' + err)		
			reject(err);
		}
		else
		{
			resolve(result);
		}});
	});
}

// This helps to import symbols in test suite
try {
	module.exports = { ParserExtension, promisify };
} catch(e) { }
