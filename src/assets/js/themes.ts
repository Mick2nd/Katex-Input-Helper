import { Observable } from "./patterns/observable";

/**
 * @abstract Themes or Styles support. This is an Observable.
 * 
 * @extends Observable
 */
export class Themes extends Observable {
	dir = "";
	cssActive = false;
	activeTheme = "";
	supportedThemes = [ 'aguas', 'gray', 'black', 'bootstrap', 'metro' ];
	
	/**
	 * @abstract Constructor.
	 */
	constructor() {
		super();
	}
	
	/**
	 * @abstract Initializes the theme choice.
	 * 
	 * This method must be invoked during initialization time.
	 * 
	 * @param activeTheme - the theme as it comes from the stored parameters
	 * @param dir - the language direction parameter (comes from the selected language)
	 */
	async initialiseThemeChoice(activeTheme, dir = 'ltr') {
		var inst = this;
		await this.appendCss(activeTheme, dir);												// initialisation -> 'load' css files
		$("[name='style']").filter(`[value=${activeTheme}]`).attr("checked", "checked"); 	// select Radio button

		$("input[name='style']").change(function() { 										// change handler of style changes
			var activeTheme = $("input[name='style']:checked").val(); 
			inst.activateStyle(activeTheme).then(() => { });
		}); 
		
		await this.activateStyle(activeTheme);
	}
	
	/**
	 * @abstract Activate the style setting.
	 * 
	 * This activates one and disables the others of several styles. On ready this method notifies
	 * possible Observers registered on this Observable.
	 * 
	 * @param activeTheme - the theme / style to be activated.
	 */
	async activateStyle(activeTheme) {
		if (activeTheme == this.activeTheme) {												// no change
			return;
		}
		
		this.activeTheme = activeTheme;
		var colorType = '';

		if (activeTheme == 'black') { colorType = 'black'; }
		
		for (const theme of this.supportedThemes) {
			if (theme === 'aguas') { continue; }
			
			$(`#${theme}, #${theme}-extend`).attr('disabled', theme !== activeTheme);
		}
		
		this.notify(activeTheme, this.dir, colorType);
	}

	/**
	 * @abstract Appends a series of required CSS files to head of html.
	 * 
	 * The HTML itself cannot do this, because the active theme dynamically changes. This is an
	 * initialisation time task.
	 * 
	 * @param activeTheme - the active theme
	 * @param dir - direction of the active language (ltr or rtl)
	 */
	async appendCss(activeTheme, dir = 'ltr') {
		console.info(`Active theme is ${activeTheme}`);
		
		var opts = { assert: { 
			type: 'css',
		} };
		await import('./jquery-easyui-MathEditorExtend/themes/rtl.css', opts);
		$('link').last()
		.attr('id', 'RTLstyle')
		.attr('disabled', true);
		
		for (const theme of this.supportedThemes) {
			if (theme === 'aguas') { continue; }
				
			await import(`./jquery-easyui/themes/${theme}/easyui.css`, opts);
			$('link').last()
			.attr('id', theme);

			await import(`./jquery-easyui-MathEditorExtend/themes/${theme}/easyui.css`, opts);
			$('link').last()
			.attr('id', `${theme}-extend`);
		}
		
		this.activateStyle(activeTheme);
		this.cssActive = true;
		this.setRTLstyle(dir);
	}
	
	/**
	 * @abstract Sets the RTL style.
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
