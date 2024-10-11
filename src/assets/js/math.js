
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
	parameters = null;
	parser = null;
	dynamicPanels = [];
	
	/**
	 * Constructor.
	 */
	constructor(runNotKatex, localizer, codeMirror, parameters, parser) {
		this.location = getScriptLocation();
		this.mathTextInput = document.getElementById('mathTextInput'); 
		this.mathVisualOutput = document.getElementById('mathVisualOutput');
		this.codeMirror = codeMirror;
		this.runNotKatex = runNotKatex;
		this.localizer = localizer;
		this.parameters = parameters;
		this.parser = parser;	
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
		}
	}
	
	/**
	 * Updates Tables in Panels or Dialogs by translating contained Math. Although this is a Math
	 * method, it also updates some image references. TODO: implement SRP (single responsibility principle)
	 */
	updateTables() {
		try {
			var inst = this;
			var entries = $('.panel-body table tbody tr td a.easyui-tooltip, .easyui-dialog div a.s');
			console.info(`Katex: ${entries.length} td items`);
			entries.each(function(idx, a) {
				if (a) {
					try {
						var html = a.innerHTML;
						var count = html.split('$').length - 1;
						var text = a.innerText;
						var dm = (text.includes('$$') || text.includes('{equation}'));		// $$ triggers display mode
						if (count == 2 || text == '$\\$$' || text.includes('\\ce')) {		// normal case: math
							text = text.replace(/□/g, '\\square');
							inst.insertMath(text, a);
						} else if (count > 2 && !dm) {										// image with surrounding characters
							var text1 = a.firstChild.textContent;
							text1 = text1.substring(1, text1.length - 1);
	
							var text2 = a.lastChild.textContent;
							text2 = text2.substring(1, text2.length - 1);
	
							var img = a.children[0];
							var src = img.attributes['src'];
							img.setAttribute('src', inst.location + src.value);
							
							inst.insertMath(text2, a);
							var ch = a.children[0];
							inst.insertMath(text1, a);
							a.appendChild(img);
							a.appendChild(ch);
						} else if (dm) {
							inst.updateAnchor(a);
						} else {															// direct image case
							var img = a.firstChild;
							if (img && img.hasAttribute('src')) {
								var src = img.attributes['src'].value;
								if (!src.startsWith('file')) {
									src = inst.location + src;
								}
								img.setAttribute('src', src);
							}
						}
					} catch(e) {
						console.warn(`Katex: updateTables : ${a.innerText} : ${e}`);
					}
				}
			})
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
	
	/**
	 * The Latex gets the true Latex symbol.
	 */
	updateLatexMenu() {
		
		this.inplaceUpdate('#mLaTeX_TEXT span');
	}
	
	/**
	 * It is intended to create this Panel dynamically taking the content from the Settings.
	 */
	initialiseDynamicPanel(id) {
		var inst = this;
		var fPanelMoreID = `w${id}_MORE`;
		var fPanelMore = $('#' + fPanelMoreID); 
		
		if (inst.dynamicPanels.indexOf(fPanelMoreID) == -1) { 
			inst.dynamicPanels.push(fPanelMoreID); 
			console.info(`Here in initialiseDynamicPanel 1`);
			$(fPanelMore).dialog({ 
				onLoad: 
					function() {  }, 
				onMove: 
					function(left, top) { 
						console.info(`Panel with id ${fPanelMoreID} moved : ${left},${top}`);
						inst.parameters.onPanelMove(fPanelMoreID, left, top);
					}, 
				onResize:
					function(width, height) {
						console.info(`Panel with id ${fPanelMoreID} resized : ${width},${height}`);
						inst.parameters.onPanelResize(fPanelMoreID, width, height);
					},
				title: $("#" + fPanelMoreID + "_TITLE").html()
			})
			.dialog('open')
			.html(`${inst.buildCustomEquations()}`);

			console.info(`Here in initialiseDynamicPanel 2`);
			inst.inplaceUpdate(`#${fPanelMoreID} table tbody tr td a.s`);
			inst.parser.parse(`#${fPanelMoreID}`, 1, function(selector, ctx) {
				inst.inplaceUpdate(`#${fPanelMoreID} table a.s`, true);
				inst.initialiseDatagrid(`#${fPanelMoreID} .easyui-datagrid`);
			}); 

		} else { 
			$(fPanelMore).dialog('open'); 
		}
	}
	
	buildCustomEquations() {
		var no = 1;
		var formula = "\\sum{\\vec{F} } = \\vec{0} \\Rightarrow \\frac{d\\vec{v}}{dt} = 0 ";
		var title = "Newton's first law";
		
		return `<table id="customDatagrid" class="easyui-datagrid" cellspacing=0 style="border-spacing:0px; border-collapse:collapse;width:100%">
	    <thead>
	        <tr>
	            <th data-options="field:'title',editor:'text',width:200">Titel</th>
	            <th data-options="field:'formula',width:200">Formel</th>
	        </tr>
	    </thead>
	    <tbody>
			<tr>
				<td class=bl>${title}</td>
				<td class="bl"><a style="text-align:left;" href="#" class="s" latex="${formula}">$${formula}$</a></td>
			</tr>
		</tbody>
		</table>
		<div style="position: absolute; right: 10px; bottom: 10px;" >
			<a href="#" id="btCUSTOM_EQUATIONS_SAVE" class="easyui-linkbutton" iconcls="icon-save">
				<span locate="SAVE">${this.localizer.getLocalText('SAVE')}</span>
			</a>
		</div>`
		.replace(/\n\s*?/sg, '\n');
	}
	
	initialiseDatagrid(selector) {
		this.parser.parse(selector, 1, function(selector, ctx) {
			console.info(`initialiseDatagrid with callback for ${selector}`);
			$(selector)
			.datagrid('enableCellEditing')
			.datagrid('gotoCell', {
	            index: 0,
	            field: 'title'
        	});
        	//.datagrid('acceptChanges');
        });
		
		$('#btCUSTOM_EQUATIONS_SAVE')
		.click( function(event) { 
			event.preventDefault();
		});
	}
	
	/**
	 * For some dialogs which are initialized lazily updates the Math.
	 */
	inplaceUpdate(selector, interactivityOnly = false) {
		try {
			var inst = this;
			var entries = $(selector);
			console.info(`Katex: ${entries.length} in-place items for selector ${selector}`);
			entries.each(function(idx, a) {
				if (a && !inst.runNotKatex) {
					if (!interactivityOnly) {
						inst.updateAnchor(a);
					}
					inst.equipWithInteractivity($(this));
				}
			});
		} catch(e) {
			console.error(`Katex: inplaceUpdate : ${e}`);
		}
	}

	/**
	 * Updates an anchor with a formula. Takes the text from original anchor content.
	 */	
	updateAnchor(a) {
		var text = a.innerText;
		var mathText = text.includes('$');
		var dm = (text.includes('$$') || text.includes('{equation}'));
		text = text.replace(/^\s{0,5}\"?\${1,2}(.*?)\${1,2}\"?\s{0,5}$/s, '$1');
		console.info(`Processed text: ${text.substring(0, 20)}`);
		if (mathText) this.insertMath(text, a, false, dm);
	}
	
	/**
	 * Equips some anchors with interactivity which they do not already have.
	 */
	equipWithInteractivity(a) {
		var vme = this;
		function getSymbol(obj) { 
			if (typeof ($(obj).attr("latex")) != "undefined") { 
				return $(obj).attr("latex"); 
			} else { 
				return vme.localizer.getLocalText("NO_LATEX"); 
			} 
		}; 

		console.info(`equipWithInteractivity ${a.attr('latex')}`);
		a
		.addClass("easyui-tooltip")
		.attr("title", function(index, attr) { return getSymbol(a); })
		.mouseover(function(event) { $("#divInformation").html(getSymbol(a)); })
		.mouseout(function(event) { $("#divInformation").html("&nbsp;"); })
		.click(function(event) { 
			event.preventDefault(); 
			var latex = a.attr("latex");
			console.info(`Click on equation: ${latex}`);
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
	 * Inserts given text into Code Mirro Editor and updates the formula in the output.
	 */
	insert(b) {
		this.codeMirror.replaceSelection(b);
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
