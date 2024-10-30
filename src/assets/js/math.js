

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
	localizer = null;
	codeMirror = null;
	parameters = null;
	parser = null;
	dynamicPanels = [];
	messager = null;
	
	/**
	 * Constructor.
	 */
	constructor(runNotKatex, localizer, codeMirror, parameters, parser) {
		this.mathTextInput = document.getElementById('mathTextInput'); 
		this.mathVisualOutput = document.getElementById('mathVisualOutput');
		this.codeMirror = codeMirror;
		this.runNotKatex = runNotKatex;
		this.localizer = localizer;
		this.parameters = parameters;
		this.parser = parser;
		this.messager = new Messager(localizer);
	}
	
	/**
	 * Sets the Code Mirror Editor instance (method injection)
	 */
	setEditorInstance(codeMirror) {
		this.codeMirror = codeMirror;
	}
	
	/**
	 * The most basic insertion method. Inserts Math into given element.
	 * 
	 * @param text - text bo be translated into math
	 * @param element - html element to be used for insertion
	 * @param multiple - if true inserts multiple math elements, separated by horizontal space
	 * @param displayMode - in display mode can handle expressions differently (for instance environments) 
	 */
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
			this.messager.show('KATEX', 'KATEX_NOT_RENDERED', e)
		}
	}
	
	/**
	 * Updates Tables in Panels or Dialogs by translating contained Math. Although this is a Math
	 * method, it also updates some image references. TODO: implement SRP (single responsibility principle)
	 */
	async updateTables() {
		try {
			var inst = this;
			var selector = '.panel-body table tbody tr td a.easyui-tooltip, .easyui-dialog div a.s';
			var entries = $(selector);
			console.debug(`Katex: ${entries.length} td or div items`);
			var im1 = 0;
			entries.each(function(idx, a) {
				
				if (a) {
					try {
						var html = a.innerHTML;
						var count = html.split('$').length - 1;
						var text = a.innerText;
						var dm = (text.startsWith('$$') || text.includes('{equation}'));	// $$ triggers display mode
						if (count == 2 || text == '$\\$$' || text.includes('\\ce')) {		// normal case: math
							text = text.replace(/□/g, '\\square');
							inst.insertMath(text, a);
						} else if (count > 2 && !dm) {										// image with surrounding characters
							var text1 = a.firstChild.textContent;
							text1 = text1.substring(1, text1.length - 1);
	
							var text2 = a.lastChild.textContent;
							text2 = text2.substring(1, text2.length - 1);
	
							var img = a.children[0];
							
							inst.insertMath(text2, a);
							var ch = a.children[0];
							inst.insertMath(text1, a);
							a.appendChild(img);
							a.appendChild(ch);
						} else if (dm) {
							inst.updateAnchor(a);
						} else {															// direct image case
							var img = a.firstChild;
							if (img && img.nodeType != Node.TEXT_NODE && img.hasAttribute('src')) {
							}
						}
					} catch(e) {
						console.warn(`Katex: updateTables : ${a.innerText} : ${e}`);
					}
				}
			})
			if (im1 > 0) {
				console.debug(`Images detected: ${im1}`)
			}				

			// TODO: TEST: changes must be updated so that easyui knows them
			await this.parser.parseAsync(selector);

		} catch(e) {
			console.error(`Katex: updateTables : ${e}`);
		}
	}
	
	/**
	 * Updates the headers of some Panels by translating contained Math.
	 */
	updateHeaders() {
		try {
			var entries = $('.panel-title span');
			console.debug(`Katex: ${entries.length} header items`);
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
	
	/**
	 * The Latex gets the true Latex symbol.
	 */
	updateLatexMenu() {
		
		this.inplaceUpdate('#mLaTeX_TEXT span');
	}
	
	/**
	 * For some dialogs which are initialized lazily updates the Math.
	 */
	inplaceUpdate(selector, javascript = false) {
		try {
			var inst = this;
			var entries = $(selector);
			console.debug(`Katex: ${entries.length} in-place items for selector ${selector}`);
			entries.each(function(idx, a) {
				if (a && !inst.runNotKatex) {
					inst.updateAnchor(a);
					inst.equipWithInteractivity($(this), javascript);
				}
			});
		} catch(e) {
			console.error(`Katex: inplaceUpdate : ${e}`);
		}
	}
	
	/**
	 * @abstract Equips some anchors with interactivity which they do not already have.
	 * 
	 * If the anchor does not have a latext attribute, it will not be equipped
	 * 
	 * @param a - the anchor to be equipped
	 */
	equipWithInteractivity(a, javascript = false) {
		var vme = this;
		function getSymbol(obj) { 
			if (typeof ($(obj).attr("latex")) != "undefined") { 
				return $(obj).attr("latex"); 
			} else { 
				return vme.localizer.getLocalText("NO_LATEX"); 
			} 
		};

		if (typeof ($(a).attr("latex")) == "undefined") {
			return;
		}
		
		console.debug(`equipWithInteractivity ${a.attr('latex')}`);
		a.addClass("easyui-tooltip s");
		
		// TODO: TEST: TRIAL WITH JAVASCRIPT
		// .attr("title", function(index, attr) { return getSymbol(a); })
		if (javascript) {
			a.attr("href", "javascript:void(0)")
			.tooltip({
				// position: 'center', // => not working, causes flickering
				content: `<span style="color:black">${getSymbol(a)}</span>`,
				onShow: function(){
					$(this).tooltip('tip').css({
						backgroundColor: 'lightyellow',
						borderColor: 'red'
					});
				}
			});
		} else {
			a.attr("href", "#")
			.attr("title", function(index, attr) { return getSymbol(a); });
		}		
		
		a.mouseover(function(event) { $("#divInformation").html(getSymbol(a)); })
		.mouseout(function(event) { $("#divInformation").html("&nbsp;"); })
		.click(function(event) { 
			event.preventDefault(); 
			var latex = a.attr("latex");
			console.debug(`Click on equation: ${latex}`);
			if (latex != undefined) { 
				vme.insert(latex); 
			} else { 
				$.messager.show({ 
					title: "<span class='rtl-title-withicon'>" + vme.localizer.getLocalText("INFORMATION") + "</span>", 
					msg: vme.localizer.getLocalText("NO_LATEX") 
				}); 
			} 
		}); 
	}

	/**
	 * Updates an anchor with a formula. Takes the text from original anchor content.
	 */	
	updateAnchor(a) {
		var text = a.innerText;
		var mathText = text.includes('$');
		var dm = (text.includes('$$') || text.includes('{equation}'));
		text = text.replace(/^\s{0,5}\"?\${1,2}(.*?)\${1,2}\"?\s{0,5}$/s, '$1');
		console.debug(`Processed text: ${text.substring(0, 20)}`);
		if (mathText) this.insertMath(text, a, false, dm);
	}
	
	/**
	 * @abstract Inserts given text into Code Mirror Editor and updates the formula in the output.
	 */
	insert(b) {
		this.codeMirror.replaceSelection(b, "stop");
		this.updateOutput();												// TODO: additional handling
	}

	/**
	 * Updates the formula in the output field. Also writes the formula back to the parameters
	 * so to be returned by the dialog to its caller.
	 */	
	updateOutput() {
		var vme = this; 
		var encloseChar = "$"; 
		var content = ""; 
		content = this.codeMirror.getValue(); 
		var dm = content.includes('\\begin{CD}');
		if (content == "") content = " "; 
		if (!vme.encloseAllFormula) { 
			content = content.replace(/</gi, "&lt;"); 
			content = encloseChar + content + encloseChar; 
		} else { 
		}

		vme.insertMath(content, null, false, dm); 
		vme.setFocus();
		this.parameters.writeParameters(this.codeMirror.getValue());
	}
	
	/**
	 * Sets the Focus to the Code Mirror Editor.
	 */
	setFocus() { 
		this.codeMirror.focus(); 
	}
}
