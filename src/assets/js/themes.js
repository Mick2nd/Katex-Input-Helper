

class Themes {
	location = "";
	dir = 'ltr';
	cssActive = false;
	
	constructor() {
		this.location = getScriptLocation();
	}
	
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
	 * Appends a series of required CSS files to head of html.
	 * The HTML itself cannot do this.
	 */
	appendCss(activeTheme, dir = 'ltr') {
		console.info(`Active theme is ${activeTheme}`);
		var vme = this;
		var location = vme.location;
		
		function singleEntry(href, title, id = "") {
			var entry = {
					element: '<link rel="stylesheet" type="text/css" disabled="true" />',
					attributes: { 
						href: `${location}${href}`,
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
						href: `${location}${href}`
					}
			};
		}
		
		function singleEntryId(href, id) {
			return {
					element: '<link rel="stylesheet" type="text/css" disabled="true" />',
					attributes: { 
						href: `${location}${href}`,
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
	
	setRTLstyle(dir = 'ltr') {
		if (this.cssActive) {
			console.info(`Html Dir is: ${dir}`);
			if (dir == 'rtl') {
				document.getElementById("RTLstyle").disabled = false; 
			} else {
				document.getElementById("RTLstyle").disabled = true; 
			}
		}
	}
}
