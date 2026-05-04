import { inject, injectable } from 'inversify';
import { IHints, IHintsClient, localizerId, ILocalizer } from './interfaces.mjs';

/**
 * This class is responsible for all User hints like Tooltips and Information 
 * Area notifications.
 * 
 * Ideas:
 * - register all configured instances to support language changes.
 */
@injectable() export class Hints implements IHints {
	
	localizer: ILocalizer;
	client: IHintsClient;
	
	/**
	 * Constructor. Used to inject the localizer adn subscribe for language
	 * changes.
	 */
	constructor(
		@inject(localizerId) localizer: ILocalizer
	){
		this.localizer = localizer;
		this.localizer.subscribe(this.onLocaleChanged.bind(this));
	}
	
	/**
	 * Receives language change notifications.
	 */
	async onLocaleChanged(localizer: ILocalizer) {
		
	}
	
	inject(client: IHintsClient) {
		this.client = client;
	}
	
	/**
	 * Overrides the default implementations of *onShow* and *onPosition*.
	 * This is central for the whole application. This mainly improves the
	 * experience with certain Custom Equations tooltips.
	 */
	overrideDefaults(time: number = -1) {
		
		console.info(`Overriding the default onShow method`);
		$(function() {
			const ttwidth = 400;
			$.extend($.fn.tooltip.defaults, {
				onShow: function(e: any) {
					const tt = $(this);
					tt.tooltip('tip').css({ 
						'maxWidth': ttwidth 									// for z-index use CSS
					});

					if (time > 0) {
						setTimeout(() => { tt.tooltip('hide'); }, time);
					}
				},
				/**
				 * TODO: the problem in this algorithm is the unknown width of the 
				 * tooltip. It can be queried but gains its true width after a time.
				 */
				onPosition: function(){
					const left = $(this).offset().left;
					const leftArrow = $(this).width() / 2;
					const shift = leftArrow > ttwidth * 0.67 ? leftArrow : 0;	// for parent windows with large width apply a shift
					
					$(this).tooltip('tip').css('left', left + shift);
				    $(this).tooltip('arrow').css('left', Math.min(30, leftArrow + shift));
				}
			});
		});
		console.assert(typeof $.fn.tooltip.defaults.onShow === 'function');
	}
	
	/**
	 * Configure a single tooltip. This destroys all previously configured options.
	 * 
	 * @param jqThis - the jquery object of the parent
	 * @param options - the options to be configured
	 */
	configureTooltip(jqThis: any, options: any) {
		const defaultOnShow = $.fn.tooltip.defaults.onShow;
		const defaultOnPosition = $.fn.tooltip.defaults.onPosition;

		if (!options.onShow) {
			options.onShow = defaultOnShow;
		}
		if (!options.onPosition) {
			options.onPosition = defaultOnPosition;
		}
		
		$(jqThis).tooltip(options);
	}
	
	/**
	 * Equips all tooltips selected by a given selector with localized content.
	 */
	localizeTooltip(selector: string) {
		const inst = this;
		$(`${selector}.easyui-tooltip`)											// the spans are embedded in titles (tooltips)
		.each(function() {
			try {
				if (inst.isLocalized(this, 'content')) {
					const title = inst.localizeOption(this, 'content');
					inst.configureTooltip(this, {
						content: title
					});
				}
				
			} catch(e) {
				console.warn(`easyui-tooltip warning : ${e}`);
			}
		});
	}
	
	/**
	 * Equips all symbol anchors selected by the given selector with symbols.
	 * The selector is supplemented by the anchor of symbol subselector.
	 * 
	 * @param selector - selector of the container, 'a.s[latex]' will be truncated
	 */
	symbolizeTooltip(selector: string) {
		const inst = this;
		const preparedSelector = this.prepareSelector(selector);

		$(`${preparedSelector} a.s`)
		.addClass('easyui-tooltip')
		.each(function() {
			
			$(this).attr("href", "javascript:void(0)");
			const tt = inst.getSymbol(this);
			const encoded = tt.replace(/</gs, '&lt;');				// GUI does not like text looking like tag begin -> encode
			inst.configureTooltip(this, { content: encoded });
		});

		$(`${preparedSelector} a.more`)								// this is solely for a single ...more button linking to a dialog
		.addClass("easyui-tooltip")									// containing more formulae.
		.attr("title", function(_index: number, _attr: any) {
			const tt = inst.localizer.getLocalText('LOADING_MORE_FORMULAE');
			return `<span locate='LOADING_MORE_FORMULAE'>${tt}</span`; 
		});

		inst.provideInteractivity(preparedSelector);				// TODO: Perhaps on other place

		/*
		await vme.parser.parseAsync("#" + fPanelID); 
		await this.math.updateTables();
		*/
	}
	
	/**
	 * Provides info in the Info panel (status line) and onClick handler.
	 */
	provideInteractivity(selector: string) {

		const inst = this;
		$(`${selector} a.s`).on('mouseover', function(event: any) { 
			const latex = inst.getSymbol(this);
			const encoded = latex.replace(/</gs, '&lt;');				// GUI does not like text looking like tag begin -> encode
			$(".divInformation").html(encoded); 
		});
		$(`${selector} a.s`).on('mouseleave', function(event: any) { 
			$(".divInformation").html("&nbsp;"); 
		});
				
		$(`${selector} a.s`).on('click', function(event) {
			event.preventDefault(); 
			let info: any = inst.beginEndInfo(this);
			if (info) {
				const [ a, b ] = info;
				inst.client.tag(a, b);
				return;
			}
			info = inst.latex(this);
			if (info) {
				inst.client.insert(info);
				return;
			}
			inst.client.missing();
		}); 		
	}
	
	/**
	 * We get a normalized selector without anchor part.
	 */
	prepareSelector(selector: any) : string {
		if (typeof selector !== 'string') {
			throw new TypeError(`No string selector in prepareSelector!`);
		}
		if (selector.endsWith('a.s[latex]')) {
			console.warn(`No normalized selector in prepareSelector : ${selector}`);
			return selector.slice(0, -10);
		}
		if (selector.endsWith('a')) {
			console.warn(`No normalized selector in prepareSelector : ${selector}`);
			return selector.slice(0, -1);
		}
		return selector;
	}
	
	/**
	 * Given an anchor object, determines and returns the included
	 * LATEX code used as info for tool tip and info line.
	 */
	private getSymbol(a: any) {
		let info: any = this.beginEndInfo(a);
		if (info) return info[0] + info[1];
		info = this.latex(a);
		if (info) return info;
		return '?'; 
	};

	/**
	 * Returns the begin + end info of an anchor.
	 */
	private beginEndInfo(a: any) {
		if ($(a).attr("lbegin") != undefined && $(a).attr("lend") != undefined) 
			return [$(a).attr("lbegin"), $(a).attr("lend")];
		return undefined; 
	};

	/**
	 * Returns the latex info of an anchor.
	 */
	private latex(a: any) {
		if ($(a).attr("latex") != undefined)
			return $(a).attr("latex");
		return undefined;
	};

		
	/**
	 * Checks if the element selected by given jquery object is localized.
	 * This does not require an id.
	 */
	private isLocalized(jqThis: any, name: string, func: any = $.fn.tooltip) {
		
		const value = func.bind($(jqThis))('options')[name];							// do something to preserve the TITLE: this is an option
		if (!value) {
			return false;
		}
	
		let html = $.parseHTML(value);													// parse it into html object
		let locate = $(html).attr('locate');											// extract the locate attribute
		if (!locate) {
			return false;
		}
		
		return true;
	}
	
	/**
	 * Used to localize an option.
	 * Place this service into this base class to get access everywhere.
	 */	
	private localizeOption(jqThis: any, name: string, func: any = $.fn.tooltip) {
		
		let value = func.bind($(jqThis))('options')[name];								// do something to preserve the TITLE: this is an option
		
		let html = $.parseHTML(value);													// parse it into html object
		let locate = $(html).attr('locate');											// extract the locate attribute
		let located = this.localizer.getLocalText(locate);								// use it to get localized text
		$(html).html(located);
		let htmlString = ((html[0] as any) as Element).outerHTML;						// insert it into orginal html
		
		return htmlString;
	}
}
