
class ParserExtension {
	queue = [];
	item = null;
	
	constructor() {
		var inst = this;
		$.parser.onComplete = function(ctx) {
			inst.onComplete(ctx);
			inst.next(ctx);
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
		this.item = null;
		if (item != null) {
			console.info(`onComplete: ${this}`);
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
		return `Diagnostic info: active item: ${JSON.stringify(this.item)}, queue: ${JSON.stringify(this.queue)}`;
	}
}
