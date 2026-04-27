import { Observable } from './patterns/observable.mjs';
import { IThemes, parserId, IParser } from './interfaces.mjs';
import { inject } from 'inversify';

/**
 * Themes or Styles support. This is an Observable.
 * 
 * @extends Observable
 */
export class Themes extends Observable implements IThemes {
	dir = "";
	cssActive = false;
	activeTheme = "";
	supportedThemes = [ 'aguas', 'gray', 'black', 'bootstrap', 'metro' ];
	opts: any;
	parser: IParser;
	
	/**
	 * Constructor.
	 */
	constructor(
		@inject(parserId) parser
	) {
		super();

		this.parser = parser;
		this.opts = { 
			with: { 
				type: 'css',
			}
		};
	}
	
	/**
	 * Initializes the theme choice, the dialog to select a theme.
	 * 
	 * This method must be invoked during initialization time. All other processing
	 * is done internally.
	 * 
	 * @param activeTheme - the theme as it comes from the stored parameters
	 * @param dir - the language direction parameter (comes from the selected language)
	 */
	async initialiseThemeChoice(activeTheme: string, dir = 'ltr') {
		let inst = this;
		$("[name='style']").filter(`[value=${activeTheme}]`).attr("checked", "checked"); 	// select Radio button

		$("input[name='style']").on('change', function() { 									// change handler of style changes
			let activeTheme = $("input[name='style']:checked").val() as string; 
			inst.activateStyle(activeTheme).then(() => { });
		}); 
		
		await this.activateStyle(activeTheme);
		this.setRTLstyle(dir);
	}

	/**
	 * Invoked at the beginning of the initialization phase in the client.
	 */	
	async preInitialize() : Promise<void> {

		await import(/* webpackChunkName: 'rtl'*/ './jquery-easyui-MathEditorExtend/themes/rtl.css', this.opts);
		$('link[href$="rtl.styles.css"]')
		.attr('id', 'RTLstyle')
		.attr('disabled', true);
		
		await import(/* webpackChunkName: 'aguas'*/ `./jquery-easyui/themes/default/easyui.css`, this.opts);
		$('link[href$="aguas.styles.css"]')
		.attr('id', 'aguas')
		.attr('disabled', false)
		.addClass('kihtheme');
		
		await import(/* webpackChunkName: 'aguas-extend'*/ `./jquery-easyui-MathEditorExtend/themes/aguas/easyui.css`, this.opts);
		$('link[href$="aguas-extend.styles.css"]')
		.attr('id', `aguas-extend`)
		.attr('disabled', false)
		.addClass('kihtheme');		
	}
	
	/**
	 * Initializes css for a theme. Performed on demand.
	 */
	async initializeTheme(theme: string) {

		const themeLoaded = $(`#${theme}`).toArray().length > 0;
		if (!themeLoaded) {
			await import(`./jquery-easyui/themes/${theme}/easyui.css`, this.opts);
			$('link[href$=".styles.css"]').last()
			.attr('id', theme)
			.addClass('kihtheme');

			await import(`./jquery-easyui-MathEditorExtend/themes/${theme}/easyui.css`, this.opts);
			$('link[href$=".styles.css"]').last()
			.attr('id', `${theme}-extend`)
			.addClass('kihtheme');			
		}

		const iconsLoaded = $('.kihmenuicons').toArray().length > 0;
		if (!iconsLoaded) {
			await import(/* webpackChunkName: 'icons' */ './jquery-easyui/themes/icon.css');
			$('link[href$="icons.styles.css"]')
			.attr('id', 'icons')
			.attr('disabled', false)
			.addClass('kihmenuicons');

			await import(/* webpackChunkName: 'icons-extend' */ './jquery-easyui-MathEditorExtend/themes/icon.css');
			$('link[href$="icons-extend.styles.css"]')
			.attr('id', 'icons-extend')
			.attr('disabled', false)
			.addClass('kihmenuicons');
		}
		
		// It's essential to have the icons after the active theme : best after all themes
		if (!themeLoaded || !iconsLoaded) {
			$('.kihmenuicons').appendTo('head');
		}
		
		// TODO: NO EFFECT ON THIS
		//$('link[href$="mobile.css"]').appendTo('head');
	}
	
	/**
	 * Activate the style setting.
	 * 
	 * This activates one and disables the others of several styles. On ready this method notifies
	 * possible Observers registered on this Observable.
	 * 
	 * @param activeTheme - the theme / style to be activated.
	 */
	async activateStyle(activeTheme: string) {
		// ATTENTION! Notification may be necessary
		// if (activeTheme == this.activeTheme) {												// no change
		//	return;
		// }
		
		await this.initializeTheme(activeTheme);		// action only if not loaded yet
		
		this.activeTheme = activeTheme;
		let colorType = '';

		if (activeTheme == 'black') { colorType = 'black'; }

		$('.kihtheme').attr('disabled', true);
		$(`#${activeTheme}, #${activeTheme}-extend`).attr('disabled', false);
				
		this.notify(activeTheme, this.dir, colorType);
	}
	
	/**
	 * Sets the RTL style.
	 * 
	 * This enables / disables the RTL style file.
	 * 
	 * @param dir - the direction ('ltr' or 'rtl')
	 */
	setRTLstyle(dir = 'ltr') {
		if (dir == this.dir) {
			return;
		}
		this.dir = dir;
		console.info(`Html Dir is: ${dir}`);
		$("#RTLstyle").attr('disabled', dir !== 'rtl');
	}
}

// This helps to import symbols in test suite
try {
	module.exports = { Themes };
} catch(e) { }
