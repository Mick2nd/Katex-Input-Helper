import { Observable } from "./patterns/observable";
import { IThemes } from './interfaces';

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
	
	/**
	 * Constructor.
	 */
	constructor() {
		super();
	}
	
	/**
	 * Initializes the theme choice.
	 * 
	 * This method must be invoked during initialization time.
	 * 
	 * @param activeTheme - the theme as it comes from the stored parameters
	 * @param dir - the language direction parameter (comes from the selected language)
	 */
	async initialiseThemeChoice(activeTheme: string, dir = 'ltr') {
		let inst = this;
		await this.appendCss(activeTheme, dir);												// initialisation -> 'load' css files
		$("[name='style']").filter(`[value=${activeTheme}]`).attr("checked", "checked"); 	// select Radio button

		$("input[name='style']").on('change', function() { 									// change handler of style changes
			let activeTheme = $("input[name='style']:checked").val() as string; 
			inst.activateStyle(activeTheme).then(() => { });
		}); 
		
		await this.activateStyle(activeTheme);
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
		if (activeTheme == this.activeTheme) {												// no change
			return;
		}
		
		this.activeTheme = activeTheme;
		let colorType = '';

		if (activeTheme == 'black') { colorType = 'black'; }
		
		$('.theme').attr('disabled', true);
		$(`#${activeTheme}, #${activeTheme}-extend`).attr('disabled', false);
		
		// Without reload icons disappear
		await import(/* webpackChunkName: 'icons'*/ './jquery-easyui/themes/icon.css');
		await import(/* webpackChunkName: 'icons-extend'*/ './jquery-easyui-MathEditorExtend/themes/icon.css');

				
		this.notify(activeTheme, this.dir, colorType);
	}

	/**
	 * Appends a series of required CSS files to head of html.
	 * 
	 * The HTML itself cannot do this, because the active theme dynamically changes. This is an
	 * initialisation time task.
	 * 
	 * @param activeTheme - the active theme
	 * @param dir - direction of the active language (ltr or rtl)
	 */
	async appendCss(activeTheme: string, dir = 'ltr') {
		console.info(`Active theme is ${activeTheme}`);
		
		let opts = { 
			assert: { 
				type: 'css',
			}
		};
		await import(/* webpackChunkName: 'rtl'*/ './jquery-easyui-MathEditorExtend/themes/rtl.css', opts);
		$('link[href$="rtl.styles.css"]')
		.attr('id', 'RTLstyle')
		.attr('disabled', true);
		
		/*
		*/
		for (const theme of this.supportedThemes) {
			if (theme === 'aguas') { 								// no reload, order of css important
				$('link[href$=".styles.css"]').slice(-5, -4).last() // default
				.attr('id', theme)
				.addClass('theme');
				
				$('link[href$=".styles.css"]').slice(-3, -2).last()	// extend aguas
				.attr('id', `${theme}-extend`)
				.addClass('theme');
				continue; 
			}
				
			const themeAlt = (theme == 'aguas') ? 'default' : theme;
			await import(`./jquery-easyui/themes/${themeAlt}/easyui.css`, opts);
			$('link[href$=".styles.css"]').last()
			.attr('id', theme)
			.attr('disabled', true)
			.addClass('theme');

			await import(`./jquery-easyui-MathEditorExtend/themes/${theme}/easyui.css`, opts);
			$('link[href$=".styles.css"]').last()
			.attr('id', `${theme}-extend`)
			.attr('disabled', true)
			.addClass('theme');
		}
		
		this.activateStyle(activeTheme);
		this.cssActive = true;
		this.setRTLstyle(dir);
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
		if (this.cssActive) {
			console.info(`Html Dir is: ${dir}`);
			$("#RTLstyle").attr('disabled', dir !== 'rtl');
		}
	}
}

// This helps to import symbols in test suite
try {
	module.exports = { Themes };
} catch(e) { }
