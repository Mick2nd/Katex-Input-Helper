
/**
 * Class responsible for Math Formula handling.
 * The framework supported here is Katex.
 * CodeMirror is the only supported Editor case.
 */
class MathFormulae {
	
	mathVisualOutput = null;
	mathTextInput = null;
	runNotKatex = false;
	encloseAllFormula = false; 
	menuupdateType = true;
	location = "";
	localizer = null;
	codeMirror = null;
	
	constructor(runNotKatex, localizer, codeMirror) {
		this.location = getScriptLocation();
		this.mathTextInput = document.getElementById('mathTextInput'); 
		this.mathVisualOutput = document.getElementById('mathVisualOutput');
		this.codeMirror = codeMirror;
		this.runNotKatex = runNotKatex;
		this.localizer = localizer;	
	}
	
	setEditorInstance(codeMirror) {
		this.codeMirror = codeMirror;
	}
	
	insertMath(text, element = null, multiple = false, displayMode = false) {
		try {
			var target = element;
			if (target == null) {
				target = this.mathVisualOutput;
			}
			
			if (!this.runNotKatex) {
				if (text.startsWith('$')) {
					if (! multiple) {
						text = text.substring(1, text.length - 1);
					} else {
						text = text.replace(/&nbsp;&nbsp;/g, '\\quad');
						text = text.replace(/\$/g, '');
					}
				}
				
				katex.render(text, target, { thrownOnError: false, strict: false, displayMode: displayMode, macros: { '\\box': '□' } });
			} else {
				target.innerTEXT = text;
			}
		} catch(e) {
			console.warn(`Katex: insertMath : ${e}`);
		}
	}
	
	updateTables() {
		try {
			var entries = $('.panel-body table tbody tr td a.easyui-tooltip');
			console.info(`Katex: ${entries.length} td items`);
			entries.each((idx, a) => {
				if (a) {
					var html = a.innerHTML;
					var count = html.split('$').length - 1;
					if (count == 2) {								// normal case: math
						var text = a.innerText;
						text = text.replace(/□/g, '\\square');
						this.insertMath(text, a);
					} else if (count > 2) {							// image with surrounding characters
						var text1 = a.firstChild.textContent;
						text1 = text1.substring(1, text1.length - 1);

						var text2 = a.lastChild.textContent;
						text2 = text2.substring(1, text2.length - 1);

						var img = a.children[0];
						var src = img.attributes['src'];
						img.setAttribute('src', this.location + src.value);
						
						this.insertMath(text2, a);
						var ch = a.children[0];
						this.insertMath(text1, a);
						a.appendChild(img);
						a.appendChild(ch);
					
					} else {										// direct image case
						var img = a.firstChild;
						if (img && img.hasAttribute('src')) {
							var src = img.attributes['src'].value;
							if (!src.startsWith('file')) {
								src = this.location + src;
							}
							img.setAttribute('src', src);
						}
					}
				}
			})
		} catch(e) {
			console.error(`Katex: updateTables : ${e}`);
		}
	}
	
	updateHeaders() {
		try {
			var entries = $('.panel-title span');
			console.info(`Katex: ${entries.length} header items`);
			entries.each((idx, a) => {
				if (a) {
					var text = a.innerText;
					if (text.startsWith('$')) {
						this.insertMath(text, a, true);
					}
				}
			})
		} catch(e) {
			console.error(`Katex: updateHeaders : ${e}`);
		}
	}
	
	updateLatexMenu() {
		
		this.inplaceUpdate('#mLaTeX_TEXT span');
	}
	
	inplaceUpdate(selector) {
		try {
			var inst = this;
			var entries = $(selector);
			console.info(`Katex: ${entries.length} in-place items for selector ${selector}`);
			entries.each((idx, a) => {
				if (a && !inst.runNotKatex) {
					var text = a.innerText;
					var mathText = text.includes('$');
					var dm = (text.includes('$$') || text.includes('{equation}'));
					text = text.replace(/^\s{0,5}\"?\${1,2}(.*?)\${1,2}\"?\s{0,5}$/s, '$1');
					console.info(`Processed text: ${text.substring(0, 20)}`);
					if (mathText) inst.insertMath(text, a, false, dm);
				}
			});
			this.equipWithInteractivity(selector);
		} catch(e) {
			console.error(`Katex: inplaceUpdate : ${e}`);
		}
	}
	
	equipWithInteractivity(selector) {
		var vme = this;
		function getSymbol(obj) { 
			if (typeof ($(obj).attr("latex")) != "undefined") { 
				return $(obj).attr("latex"); 
			} else { 
				return vme.localizer.getLocalText("NO_LATEX"); 
			} 
		}; 

		$(selector)
		.addClass("easyui-tooltip")
		.attr("title", function(index, attr) { return getSymbol(this); })
		.mouseover(function(event) { $("#divInformation").html(getSymbol(this)); })
		.mouseout(function(event) { $("#divInformation").html("&nbsp;"); })
		.click(function(event) { 
			event.preventDefault(); 
			var latex = $(this).attr("latex");
			console.info(`Click on equation: ${latex}`);
			if (typeof (latex) != "undefined") { 
				vme.insert(latex); 
				vme.updateOutput();
			} else { 
				$.messager.show({ 
					title: "<span class='rtl-title-withicon'>" + vme.localizer.getLocalText("INFORMATION") + "</span>", 
					msg: vme.localizer.getLocalText("NO_LATEX") }); 
			} 
		}); 
	}
	
	insert(b) {
		this.codeMirror.replaceSelection(b);
		this.setFocus();
	}
	
	updateOutput() {
		var vme = this; 
		var encloseChar = "$"; 
		var content = ""; 
		content = $(vme.mathTextInput).val(); 
		if (content == "") content = " "; 
		if (!vme.encloseAllFormula) { 
			content = content.replace(/</gi, "&lt;"); 
			content = encloseChar + content + encloseChar; 
		} else { 
		}

		vme.insertMath(content); 
	}
	
	setFocus() { 
		this.codeMirror.focus(); 
	}
}
