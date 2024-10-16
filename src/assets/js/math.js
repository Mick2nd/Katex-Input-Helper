

/**
 * This embedded class is solely responsible for the Dynamic Panel for Custom Equations.
 */
class DynamicPanel {
	parent = null;
	panelId = "";
	gridSelector = "";
	gridSelectorOfCopy = "";
	initialised = false;
	
	/**
	 * Constructor.
	 */
	constructor(panelId, parent) {
		this.panelId = panelId;
		this.parent = parent;
		this.gridSelector = `#${panelId} .easyui-datagrid`;
		this.gridSelectorOfCopy = `#${panelId} table:not(.easyui-datagrid)`;
	}

	/**
	 * It is intended to create this Panel dynamically taking the content from the Settings.
	 */
	async initialise() {
		var inst = this;
		var fPanelMoreID = this.panelId;
		var fPanelMore = $('#' + fPanelMoreID); 
		
		if (!this.initialised) { 
			this.initialised = true; 
			console.info(`Here in DynamicPanel.initialise 1`);
			$(fPanelMore).dialog({ 
				onLoad: 
					function() {  }, 
				onMove: 
					function(left, top) { 
						console.info(`Panel with id ${fPanelMoreID} moved : ${left},${top}`);
						inst.parent.parameters.onPanelMove(fPanelMoreID, left, top);
					}, 
				onResize:
					function(width, height) {
						console.info(`Panel with id ${fPanelMoreID} resized : ${width},${height}`);
						inst.parent.parameters.onPanelResize(fPanelMoreID, width, height);
					},
				title: $("#" + fPanelMoreID + "_TITLE").html()
			})
			.dialog('open');

			console.info(`Here in DynamicPanel.initialise 2`);
			await inst.parent.parser.parseAsync(`#${inst.panelId}`, 1);
			inst.parent.inplaceUpdate(`${inst.gridSelector} a.s`);
			await inst.parent.parser.parseAsync(`#${inst.panelId}`, 1);
			await inst.initialiseDatagrid(`${inst.gridSelector}`);
			inst.equipDatagridWithInteractivity();
			
			await inst.customEquationsFromParameters();

		} else { 
			$(fPanelMore).dialog('open'); 
		}
	}
	
	/**
	 * Reads the Custom Equations from the parameters.
	 */
	async customEquationsFromParameters() {
		try {
			await this.fromJson(this.parent.parameters.equationCollection);
		} catch(e) {
			
		}
	}
	
	customEquationsToParameters() {
		var customEquations = this.toJson();
		this.parent.parameters.equationCollection = customEquations;		
		this.parent.parameters.writeParameters();
	}
	
	/**
	 * Uses the given JSON compatible data to fill the data grid.
	 */
	async fromJson(json) {
		$(this.gridSelector)
		.datagrid('loadData', []);
		
		try {
			for (const equation of json) {
				if (typeof(equation[1]) == "string" && equation[1] != "[object Object]") {
					await this.addEquation(equation[0], equation[1]);
				}
			}
		} catch(e) {
			$.messager.show({
				title: 'Formula Editor',
				msg: `Could not load formulae : ${e}`
			});
		}
	}
	
	/**
	 * Reads the Equations from data grid and returns them.
	 */
	toJson() {
		var data = $(this.gridSelector)
		.datagrid('getData');
		
		var customEquations = data.rows.map(function(row) {
			var title = row.title;
			var fragment = $.parseHTML(row.formula)[0];
			console.dir(fragment);	
			var formula = fragment.attributes['latex'].value;
			return [ title, formula ];
		})
		
		return customEquations;
	}
	
	/**
	 * Adds an Equation to the grid.
	 */
	async addEquation(title, formula) {
		$(this.gridSelector)
		.datagrid(
			'appendRow', {
			title: title,
			formula: this.buildAnchor(formula)	 
		})
		.datagrid('acceptChanges', {});
		
		await this.parent.parser.parseAsync(this.gridSelector, 1);
		
		var anchor = $(`${this.gridSelectorOfCopy} a`);
		this.parent.inplaceUpdate(anchor);
		this.equipDatagridWithInteractivity();
	}
	
	editCell(index = -1) {
		if (index == -1) {
			index = $(this.gridSelector).datagrid('getRows').length - 1;
		}
		
		var input = $(this.gridSelector)
		.datagrid('editCell', {
			index: index,
			field: 'title'
		})
		.datagrid('input', {
			index: index,
			field: 'title'
		});
		if (input) {
			input.select();
		}	
	}
	
	/**
	 * Builds a single Anchor from formula.
	 */
	buildAnchor(formula) {
		return `<a style="text-align:left;" href="#" class="s easyui-tooltip" title="${formula}" latex="${formula}">$${formula}$</a>`;
	}
	
	/**
	 * Initialises a Data Grid given by the selector
	 */
	async initialiseDatagrid(selector) {
		var inst = this;
		await this.parent.parser.parseAsync(selector, 1);
		console.info(`initialiseDatagrid for ${selector}`);
		$(selector)
		.datagrid({
			onAfterEdit: function(idx, row, changes) {
				console.info(`onAfterEdit for ${selector}`);
				inst.parent.inplaceUpdate(`${inst.gridSelectorOfCopy} a`);
				inst.customEquationsToParameters();
				return true;
			},
			onCancelEdit: function(idx, row) {
				console.info(`onCancelEdit for ${selector}`);
				inst.parent.inplaceUpdate(`${inst.gridSelectorOfCopy} a`);
				return true;
			}
		})
		.datagrid('enableCellEditing')
		.datagrid('gotoCell', {
            index: 0,
            field: 'title'
    	});
		
		$('#btCUSTOM_EQUATIONS_ADD')
		.click(async function(event) { 
			event.preventDefault();
			
			var selectedText = inst.parent.codeMirror.getSelection();
			if (selectedText != "") {
				await inst.addEquation('Placeholder', selectedText);
				inst.editCell();
			} else {
				$.messager.show({
					title: 'Formula Editor',
					msg: 'Please, select some text!'
				});
				return;
			}
		});

		$('#btCUSTOM_EQUATIONS_REMOVE')
		.click(async function(event) { 
			event.preventDefault();
			var dg = $(inst.gridSelector);
			var cell = dg.datagrid('cell');
			if (cell) {
				console.dir(cell);
				dg.datagrid('deleteRow', cell.index);	  	  
			} else {
				$.messager.show({
					title: 'Formula Editor',
					msg: 'Please, select a cell!'
				});
				return;
			}
		});
		
		$('#btCUSTOM_EQUATIONS_SAVE')
		.click(async function(event) {
			event.preventDefault();
			console.info('Click on btCUSTOM_EQUATIONS_SAVE');
			var data = JSON.stringify(inst.toJson());					// must be a JSON string
			var type = 'application/json';
			
			var fileHandler = new FileHandler();
			fileHandler.saveFile(data, type, "fSAVE_CUSTOM_EQUATIONS");
		});
		
		$('#btCUSTOM_EQUATIONS_LOAD')
		.click(async function(event) {
			event.preventDefault();
			var fileHandler = new FileHandler();
			var json = await fileHandler.loadFile("fOPEN_CUSTOM_EQUATIONS");
			await inst.fromJson(JSON.parse(json));
		});
	}

	/**
	 * Equips the data grid anchors with interactivity. This is necessary because original event handlers
	 * do not stay active.
	 */
	equipDatagridWithInteractivity() {
		var inst = this;
		function getSymbol(obj) { 
			if ($(obj).attr("latex") != undefined) { 
				return $(obj).attr("latex"); 
			} else { 
				return undefined; 
			} 
		}; 
		var selector = `${this.gridSelectorOfCopy}`;
		
		try {
			var grid = $(selector);
			grid
			.on('mouseover', 'a', function(event) { 
				var latex = getSymbol(event.target);
				if (latex) $("#divInformation").html(latex); 
			})
			.on('mouseout', 'a', function(event) { $("#divInformation").html("&nbsp;"); })
			.on('click', 'a', function(event) {
				event.preventDefault(); 
				var a = $(event.target);
				var latex = a.attr("latex");
				console.info(`Click on equation: ${latex}`);
				if (latex != undefined) { 
					inst.parent.insert(latex); 
				} else { 
					$.messager.show({ 
						title: "<span class='rtl-title-withicon'>" + inst.parent.localizer.getLocalText("INFORMATION") + "</span>", 
						msg: inst.parent.localizer.getLocalText("NO_LATEX") 
					}); 
				} 
			});
		} catch(e) {
			console.error(`Katex: equipDatagridWithInteractivity : ${e}`);
		}
	}
}


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
	dynamicPanel = null;
	dynamicPanels = [];
	
	/**
	 * Constructor.
	 */
	constructor(runNotKatex, localizer, codeMirror, parameters, parser) {
		this.location = getScriptLocation();
		this.mathTextInput = document.getElementById('mathTextInput'); 
		this.mathVisualOutput = document.getElementById('mathVisualOutput');
		this.dynamicPanel = new DynamicPanel("wf_CUSTOM_EQUATIONS_MORE", this);
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
							if (img && img.nodeType != Node.TEXT_NODE && img.hasAttribute('src')) {
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
	async initialiseDynamicPanel(id) {
		await this.dynamicPanel.initialise();
	}
	
	/**
	 * For some dialogs which are initialized lazily updates the Math.
	 */
	inplaceUpdate(selector) {
		try {
			var inst = this;
			var entries = $(selector);
			console.info(`Katex: ${entries.length} in-place items for selector ${selector}`);
			entries.each(function(idx, a) {
				if (a && !inst.runNotKatex) {
					inst.updateAnchor(a);
					inst.equipWithInteractivity($(this));
				}
			});
		} catch(e) {
			console.error(`Katex: inplaceUpdate : ${e}`);
		}
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
