
class ParserExtension {
	queue = [];
	item = null;
	async = false;
	completeCount = 0;
	
	constructor(async = false) {
		this.async = async;
	}
	
	initialise() {
		var inst = this;
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
	}
	
	async parseAsync(selector, ctx, delay = 0) {
		try {
			var item = {
				ctx: ctx,
				delay: delay,
				selector: selector,
				promise: null,
				onComplete: null
			};
			this.queue.push(item);
			this.nextAsync(ctx);
			item.promise = this.promisify(this, this.startParseAsync);
			
			return item.promise;
		} catch(err) {
			Promise.reject(err);
		}
	}
	
	nextAsync(ctx) {
		try {
			var item = this.queue.shift();
			this.item = item;
		} catch(e) {
			console.warn(`next without queued item: ${this}`);
			this.item = null;
		}
	}
	
	startParseAsync(cb) {
		this.item.onComplete = cb;
		$.parser.parse(this.item.selector);			
	}

	onCompleteAsync(ctx) {
		this.completeCount ++;
		if (typeof ctx != "string") {
			console.warn(`onCompleteAsync for external source - not handled.`);
			return;
		}
		var item = this.item;
		if (item != null) {
			console.info(`onCompleteAsync for ${ctx}: ${this}`);
			this.item = null;
			if (item.delay > 0) {
				var timer = setInterval(
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
	
	parse(selector, ctx, onComplete, delay = 0) {
		this.queue.push({
			selector: selector,
			onComplete: onComplete,
			ctx: ctx,
			delay: delay
		});
		console.info(`Parse after pushing: ${this}`);
		this.next(ctx);
	}
	
	next(ctx) {
		try {
			var item = this.queue.shift();
			this.item = item;
			$.parser.parse(item.selector);			
		} catch(e) {
			console.warn(`next without queued item: ${this}`);
			this.item = null;
		}
	}
	
	onComplete(ctx) {
		var item = this.item;
		if (item != null) {
			console.info(`onComplete: ${this}`);
			this.item = null;
			if (item.delay > 0) {
				var timer = setInterval(
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
	
	/**
	 * @abstract Converts a method with given signature and callback to a Promise returning method
	 * 
	 */
	async promisify(ob, fnc, ...args)
	{
		return new Promise((resolve, reject) =>
		{			
			fnc.bind(ob)(...args, (err, result) => {
				
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
}

	
/**
 * @abstract Converts a method with given signature and callback to a Promise returning method
 * 
 */
async function promisify(ob, fnc, ...args)
{
	return new Promise((resolve, reject) =>
	{			
		fnc.bind(ob)(...args, (err, result) => {
			
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
