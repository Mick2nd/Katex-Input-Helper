
/**
 * A simple implementation of the observable pattern.
 */
export class Observable {
	observers = null;
  
  /**
   * Initialises the instance
   */
  constructor() {
    this.observers = [];
  }

  /**
   * Subscribes a function as an Observer.
   * 
   * Supports also first time notification by providing additional arguments. This must be done
   * by overriding this function in the Observable and providing the relevant argument(s).
   */
  subscribe(func: any, ...args: any) {
    this.observers.push(func);
    if (arguments.length > 1) {							// indication that we want a first time notification
		func(...args);
	}
  }

  /**
   * Unsubscribes a function from the Observers list.
   */
  unsubscribe(func: any) {
    this.observers = this.observers.filter((observer: any) => observer !== func);
  }

  /**
   * Notifies the Observers about an event of the Observable.
   * 
   * The sent data is part of the contract between the Observable and its Observers
   */
  notify(...args: any) {
    this.observers.forEach(function(observer: any) {
		let potentialPromise = observer(...args);
    	if (potentialPromise instanceof Promise) {
			potentialPromise.then(
				(value: any) => {}
			)
		}
	});
  }

  /**
   * Notifies the Observers about an event of the Observable.
   *
   * This is the asynchronous variant of notify as asynchronous observers can be called
   * The sent data is part of the contract between the Observable and its Observers
   */
  async notifyAsync(...args: any) {
    this.observers.forEach(async function(observer: any) { 
		let potentialPromise = observer(...args);
    	if (potentialPromise instanceof Promise) {
			await potentialPromise;
		}
    });
  }
}

// This helps to import symbols in test suite
try {
	module.exports = { Observable };
} catch(e) { }
