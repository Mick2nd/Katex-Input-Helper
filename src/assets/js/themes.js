
/**
 * @abstract Themes or Styles support. This is an Observable.
 * 
 * @extends Observable
 */
class Themes extends Observable {
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
	initialiseThemeChoice(activeTheme, dir = 'ltr') {
		var inst = this;
		this.appendCss(activeTheme, dir);													// initialisation -> 'load' css files
		$("[name='style']").filter(`[value=${activeTheme}]`).attr("checked", "checked"); 	// select Radio button

		$("input[name='style']").change(function() { 										// change handler of style changes
			var activeTheme = $("input[name='style']:checked").val(); 
			inst.activateStyle(activeTheme);
		}); 
		
		this.activateStyle(activeTheme);
	}
	
	/**
	 * @abstract Activate the style setting.
	 * 
	 * This activates one and disables the others of several styles. On ready this method notifies
	 * possible Observers registered on this Observable.
	 * 
	 * @param activeTheme - the theme / style to be activated.
	 */
	activateStyle(activeTheme) {
		if (activeTheme == this.activeTheme) {												// no change
			return;
		}
		this.activeTheme = activeTheme;
		var styles = document.getElementsByTagName('link');									// all link entries are potential css files
		console.debug(`chooseStyle: have entries for tag 'link' : ${styles.length > 0}`);
		var colorType = null;
		
		for (const style of styles) { 														// enable / disable css files
			var title = style.getAttribute("title"); 
			if (title) { 
				if (title != activeTheme) { 
					style.disabled = true; 
				} else { 
					style.disabled = false; 
					colorType = style.getAttribute("colorType"); 							// and determine color type
				} 
			} 
		}
		
		this.notify(activeTheme, this.dir, colorType);										// finally notify observers
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
	appendCss(activeTheme, dir = 'ltr') {
		console.info(`Active theme is ${activeTheme}`);
		var vme = this;
		
		function singleEntry(href, title, id = "") {
			var entry = {
					element: '<link rel="stylesheet" type="text/css" disabled="true" />',
					attributes: { 
						href: `js/${href}`,
						title: title,
						disabled: `${activeTheme == title}`
					}
			};
			if (id != "") entry.attributes.id = id;
			return entry;
		}
		
		function singleEntryBasic(href) {
			return {
					element: '<link rel="stylesheet" type="text/css" />',
					attributes: { 
						href: `js/${href}`
					}
			};
		}
		
		function singleEntryId(href, id) {
			return {
					element: '<link rel="stylesheet" type="text/css" disabled="true" />',
					attributes: { 
						href: `js/${href}`,
						id: id
					}
			};
		}

		var cssDescription = [
			singleEntry("jquery-easyui/themes/default/easyui.css", "aguas"),
			singleEntry("jquery-easyui-MathEditorExtend/themes/aguas/easyui.css", "aguas"),
			singleEntry("jquery-easyui/themes/gray/easyui.css", "gray"),
			singleEntry("jquery-easyui-MathEditorExtend/themes/gray/easyui.css", "gray"),
			singleEntry("jquery-easyui/themes/metro/easyui.css", "metro"),
			singleEntry("jquery-easyui-MathEditorExtend/themes/metro/easyui.css", "metro"),
			singleEntry("jquery-easyui/themes/bootstrap/easyui.css", "bootstrap"),
			singleEntry("jquery-easyui-MathEditorExtend/themes/bootstrap/easyui.css", "bootstrap"),
			singleEntry("jquery-easyui/themes/black/easyui.css", "black"),
			singleEntry("jquery-easyui-MathEditorExtend/themes/black/easyui.css", "black", "EasyuiCSS"),

			singleEntryId("jquery-easyui-MathEditorExtend/themes/rtl.css", "RTLstyle"),
			
			singleEntryBasic("jquery-easyui/themes/icon.css"),
			singleEntryBasic("jquery-easyui-MathEditorExtend/themes/icon.css"),
			singleEntryBasic("jquery-colorpicker/css/colorpicker.css"),
			singleEntryBasic("codemirror/lib/codemirror.css"),
			singleEntryBasic("keyboard/Keyboard.css"),
			singleEntryBasic("katex/katex.min.css"),
			singleEntryBasic("dialog.css")
		];
		
		this.universalLoad('head', cssDescription);
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
