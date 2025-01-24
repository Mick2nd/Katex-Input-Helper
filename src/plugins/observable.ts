
/**
 * @abstract A simple implementation of the observable pattern.
 */
export class Observable {
	observers = null;
  
  /**
   * @abstract Initialises the instance
   */
  constructor() {
    this.observers = { };
  }

  /**
   * @abstract Subscribes a function as an Observer.
   * 
   * Supports also first time notification by providing additional arguments. This must be done
   * by overriding this function in the Observable and providing the relevant argument(s).
   */
  subscribe(name: string, func: Function) {
	
	if (!(name in this.observers)) {
		this.observers[name] = [ ];
	}
    this.observers[name].push(func);
  }

  /**
   * @abstract Unsubscribes a function from the Observers list.
   */
  unsubscribe(name: string, func: Function) {
	
	if (name in this.observers) {
		this.observers[name] = this.observers[name].filter((observer) => observer !== func);
	}
  }

  /**
   * @abstract Notifies the Observers about an event of the Observable.
   * 
   * The sent data is part of the contract between the Observable and its Observers
   */
  notify(name: string, ...args) {
    
	const observers = (name in this.observers) ? this.observers[name] : [ ];
	observers.forEach(function(observer) {
		
		var potentialPromise = observer(name, ...args);
    	if (potentialPromise instanceof Promise) {
			potentialPromise.then(
				(value) => {}
			);
		}
	});
  }

  /**
   * @abstract Notifies the Observers about an event of the Observable.
   *
   * This is the asynchronous variant of notify as asynchronous observers can be called
   * The sent data is part of the contract between the Observable and its Observers
   */
  /*
  async notifyAsync(name: string, ...args) {
    
	const observers = (name in this.observers) ? this.observers[name] : [ ];
	this.observers.forEach(async function(observer) {
		
		var potentialPromise = observer(name, ...args);
    	if (potentialPromise instanceof Promise) {
			await potentialPromise;
		}
    });
  }
  */
}
