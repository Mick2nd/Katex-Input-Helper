import { Observable } from "./patterns/observable";

/**
 * Themes or Styles support. This is an Observable.
 * 
 * @extends Observable
 */
export class Themes extends Observable {
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
		
		for (const theme of this.supportedThemes) {
			if (theme === 'aguas') { continue; }
			
			$(`#${theme}, #${theme}-extend`).attr('disabled', theme !== activeTheme);
		}
		
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
			if (theme === 'aguas') { continue; }
				
			await import(`./jquery-easyui/themes/${theme}/easyui.css`, opts);
			$('link[href$=".styles.css"]').last()
			.attr('id', theme);

			await import(`./jquery-easyui-MathEditorExtend/themes/${theme}/easyui.css`, opts);
			$('link[href$=".styles.css"]').last()
			.attr('id', `${theme}-extend`);
		}
		
		// TEST
//		await import(/* webpackChunkName: 'gray'*/  `./jquery-easyui/themes/gray/easyui.css`, opts);
//		$('link[href$="gray.styles.css"]')
//		.attr('id', 'gray');
//		await import(/* webpackChunkName: 'gray-extend'*/ `./jquery-easyui-MathEditorExtend/themes/gray/easyui.css`, opts);
//		$('link[href$="gray-extend.styles.css"]')
//		.attr('id', `gray-extend`);
//		
//		await import(/* webpackChunkName: 'black'*/  `./jquery-easyui/themes/black/easyui.css`, opts);
//		$('link[href$="black.styles.css"]')
//		.attr('id', 'black');
//		await import(/* webpackChunkName: 'black-extend'*/ `./jquery-easyui-MathEditorExtend/themes/black/easyui.css`, opts);
//		$('link[href$="black-extend.styles.css"]')
//		.attr('id', `black-extend`);
//		
//		await import(/* webpackChunkName: 'bootstrap'*/  `./jquery-easyui/themes/bootstrap/easyui.css`, opts);
//		$('link[href$="bootstrap.styles.css"]')
//		.attr('id', 'bootstrap');
//		await import(/* webpackChunkName: 'bootstrap-extend'*/ `./jquery-easyui-MathEditorExtend/themes/bootstrap/easyui.css`, opts);
//		$('link[href$="bootstrap-extend.styles.css"]')
//		.attr('id', `bootstrap-extend`);
//		
//		await import(/* webpackChunkName: 'metro'*/  `./jquery-easyui/themes/metro/easyui.css`, opts);
//		$('link[href$="metro.styles.css"]')
//		.attr('id', 'metro');
//		await import(/* webpackChunkName: 'metro-extend'*/ `./jquery-easyui-MathEditorExtend/themes/metro/easyui.css`, opts);
//		$('link[href$="metro-extend.styles.css"]')
//		.attr('id', `metro-extend`);
		// TEST END
		
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
