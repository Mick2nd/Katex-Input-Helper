import { State, IToggler } from './interfaces.mjs';


/**
 * This class implements a toggle button for the Custom Equations dialog. It
 * toggles the Categories region on and of.
 */
export class RegionToggler implements IToggler {
	
	id: string;
	layout: string;
	state: any;
	parent: any;

	firstRegion = "west";
	firstIcon: string;
	secondIcon: string;
	tooltipInitialized = false;
	
	/**
	 * @constructor
	 */
	constructor(parent: any) {
		
		this.parent = parent;
		this.firstIcon = '&#x2770;';
		this.secondIcon = '&#x2771;';
	}
	
	/**
	 * Performs initialization. Initialization time is the time, where the button
	 * starts living.
	 * 
	 * @param id - the id of the button
	 * @param layout - the layout containing the region
	 * @param state - the initial state
	 */
	initialize(data: { id: string, layout: string, state: State }): void {
		this.id = data.id;
		this.layout = data.layout;
		this.state = data.state;
	
		this.addResolver();
		this.update();
	
		let inst = this;
		$(this.id).on('click', function(event) {
			event.preventDefault();
			inst.cycleState();
			inst.update();
		});
		
		$(this.id).on('mouseover', function(event) {
			event.preventDefault();
			if (inst.tooltipInitialized) { return; }
			inst.tooltipInitialized = true;
			inst.updateTooltip();
		});
	}
	
	cycleCheck() : any {
		
		let state = 0;
		switch(this.state) {
			case State.First:
				state = State.Both; break;
			case State.Both:
				state = State.Second; break;
			case State.Second:
				state = State.First; break;
		}
		
		return state;
	}

	/**
	 * Cyclicly switches between Both - Second - First states;
	 */
	cycleState() : void {		
		this.state = this.cycleCheck();
	}
	
	/**
	 * Updates the UI as result of cyleState between Categories ON and OFF and 
	 * BOTH states.
	 */
	update() {
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

		text = `&nbsp;${text}&nbsp;`;
		$(`${this.id} span`).html(text);
		this.updateTooltip();
	}
	
	/**
	 * The resolver used to dynamically update the tooltip.
	 */
	resolve(key: string) : string {
		if (key == "TTREGION") {
			switch(this.cycleCheck()) {
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
	 * Adds a resolver to the Localizer instance.
	 */
	private addResolver() {
		this.parent.localizer.addResolver(this.resolve.bind(this));
	}
	
	private updateTooltip() {
		
		let localText = this.resolve('TTREGION');
		if (localText != "") $("span[locate='TTREGION']").text(localText);
	}
}


/**
 * Used to toggle the Unicode list in the Unicode window between hidden and block
 * view.
 */
export class ContainerToggler implements IToggler {
	
	firstIcon: string;
	secondIcon: string;
	parent: any;
	id: string;
	view: string;
	active: boolean = true;
	tooltipInitialized = false;
	
	/**
	 * @constructor
	 */
	constructor(parent: any) {
		
		this.parent = parent;
		this.firstIcon = '&#x2770;';
		this.secondIcon = '&#x2771;';		
	}

	/**
	 * Performs the initialization.
	 * 
	 * @param id - id of the toggle button
	 * @param view - id of the view to toggle OFF and ON
	 * @param state - the start state (true for active)
	 */	
	initialize(data: { id: string, view: string, state: boolean }): void {
		this.id = data.id;
		this.view = data.view;
		this.active = data.state;

		this.addResolver();
		this.update();
	
		let inst = this;
		$(this.id).on('click', function(event) {
			event.preventDefault();
			inst.cycleState();
			inst.update();
		});
		$(this.id).on('mouseover', function(event) {
			event.preventDefault();
			if (inst.tooltipInitialized) { return; }
			inst.tooltipInitialized = true;
			inst.updateTooltip();
		});
	}
	
	cycleCheck() : boolean {
	    return !this.active;
	}
	
	cycleState(): void {
	    this.active = this.cycleCheck();
	}
	
	/**
	 * Updates the UI as result of cyleState.
	 */
	update() {
		
		$(this.view)
		.css('display', this.active ? 'inline-block' : 'none');
		$(`${this.id} span`).html(this.active ? this.secondIcon : this.firstIcon);
		this.updateTooltip();
	}
	
	/**
	 * The resolver used to dynamically update the tooltip.
	 */
	resolve(key: string) : string {
		if (key == "TTCONTAINER") {
			if (this.cycleCheck()) {
				return this.parent.localizer.getLocalText("TTCONTAINER_ACTIVATE");
			} else {
				return this.parent.localizer.getLocalText("TTCONTAINER_DEACTIVATE");
			}
		}
		return "";
	}

	/**
	 * Adds a resolver to the Localizer instance.
	 */
	private addResolver() {
		this.parent.localizer.addResolver(this.resolve.bind(this));
	}

	private updateTooltip() {
		
		let localText = this.resolve('TTCONTAINER');
		if (localText != "") $("span[locate='TTCONTAINER']").text(localText);
	}
}
