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
	
	/**
	 * @abstract Constructor.
	 */
	constructor() {
		super();
	}
	
	/**
	 * @abstract Appends attributes of one or more elements to another. 
	 */
	universalLoad(where, what) {
		for (var entry of what) {
			$(where)
			.append(
				$(entry.element)
				.attr(entry.attributes)
			);
		}
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
		var opts = { with: { type: 'css' } };
		this.disableThemeLinks();

		// TRYING alternative way
		// WORKS and loads all present themes!!
		var mainTheme = activeTheme;
		if (activeTheme == 'aguas') { mainTheme = 'default'; }
		if (activeTheme == 'black') { colorType = 'black'; }
		await import(`./jquery-easyui/themes/${mainTheme}/easyui.css`, opts);
		await import(`./jquery-easyui-MathEditorExtend/themes/${activeTheme}/easyui.css`, opts);
		
		this.enableThemeLinks(activeTheme);
		this.notify(activeTheme, this.dir, colorType);
	}
	
	/**
	 * @abstract Disables link tags to the theme resources.
	 * 
	 * The hope was this could enforce a new load of themes every time one selects any.
	 * Yes, but it must be combined with *enableThemeLinks*.
	 */
	disableThemeLinks() {
		$('link[href$="easyui_css.styles.css"]').attr('disabled', true);
	}
	
	/**
	 * @abstract Enables css link tags again after disabling them.
	 */
	enableThemeLinks(theme) {
		$(`link[href$="${theme}_easyui_css.styles.css"]`).removeAttr('disabled');
		if (theme == 'aguas') {
			$(`link[href$="default_easyui_css.styles.css"]`).removeAttr('disabled'); 	// ?
		}
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
		
		var opts = { with: { 
			type: 'css',
		} };
		await import(`./jquery-easyui-MathEditorExtend/themes/rtl.css`, opts);
		$('link').last()
		.attr('id', 'RTLstyle')
		.attr('disabled', true);
		
		this.setRTLstyle(dir);
		this.cssActive = true;
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
			var disabled = document.getElementById("RTLstyle").disabled;
			var newDisabled = dir !== 'rtl';										// suppress unnecessary changes => measure did not help
			if (newDisabled != disabled) {
				document.getElementById("RTLstyle").disabled = newDisabled;
				console.info(`RTL style set to: ${newDisabled}`);
			}
		}
	}
}

// This helps to import symbols in test suite
try {
	module.exports = { Themes };
} catch(e) { }
