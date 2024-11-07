
/**
 * @abstract The base class of all Panels, Dialogs, Windows.
 */
class KIHPanel {
	id = "";
	parent = null;
	initialised = false;
	
	/**
	 * @abstract Constructor
	 */
	constructor(id, parent) {
		this.id = id;
		this.parent = parent;
	}
	
	/**
	 * @abstract The handler of move events, invoked when the panel is moved.
	 * 
	 * This delegates to the *Parameters* instance.
	 */
	onMove(left, top) { 
		console.info(`Panel with id ${this.id} moved : ${left}, ${top}`);
		this.parent.parameters.onPanelMove(this.id, left, top);
	}
	
	/**
	 * @abstract The handler of resize events, invoked when the panel is resized.
	 * 
	 * This delegates to the *Parameters* instance.
	 */
	onResize(width, height) {
		console.info(`Panel with id ${this.id} resized : ${width}, ${height}`);
		this.parent.parameters.onPanelResize(this.id, width, height);
	}
	
	/**
	 * @abstract Builds an object from the events to be provided when the panel is created.
	 */
	get handlers() {
		return {
			onMove: this.onMove.bind(this),
			onResize: this.onResize.bind(this)
		};
	}
	
	/**
	 * @abstract Initialise method, creates the *Panel* with the handlers provided.
	 */
	async initialise() {
		$(`#${this.id}`).dialog(this.handlers)
	}
	
	/**
	 * @abstract Shows the *Panel* and resizes (Position, Size) it to stored values.
	 */
	async show() {
		this.resize();
		this.open();
	}

	/**
	 * @abstract Resizes this panel with the values in parameters.
	 */
	resize() {
		if (this.id in this.parent.parameters) {
			$(`#${this.id}`).panel('resize', this.parent.parameters[this.id]);
		} else {
			console.warn(`Missing id in parameters : ${this.id}`);
		}
	}
	
	/**
	 * @abstract Opens (shows) the Panel.
	 */
	open() {
		$(`#${this.id}`).dialog('open');
	}
}

/**
 * @abstract The More Dialog class.
 * 
 * This represents dialogs with Math content which is loaded on demand when the dialog is opened.
 * This content is in Katex format and will be translated to Math.
 * 
 * @extends KIHPanel
 */
class KIHMoreDialog extends KIHPanel {
	
	/**
	 * @abstract Constructor
	 */
	constructor(id, parent) {
		super(id, parent);
				
	}

	/**
	 * @abstract Initialises (creates) the dialog.
	 * 
	 * This additionally to the *super* class method provides a translation method and a title for
	 * Katex to Math in-place translation.
	 * 
	 * @param initialiseSymbolContent - method of the client to be invoked during loading
	 */
	async initialise(initialiseSymbolContent) {
		// id is the MORE id as in dialog.html file with 'w' and '_MORE'
		var vme = this;
		var fPanelMoreID = this.id;
		var fPanelMore = $('#' + fPanelMoreID);
		var htmlFile = fPanelMoreID.substring(1); 
		
		$(fPanelMore).dialog({ 
			onLoad: async function() { await initialiseSymbolContent(fPanelMoreID); }, 
			title: $(`#${fPanelMoreID}_TITLE`).html() 
		}); 
		await super.initialise(fPanelMoreID);
		$(fPanelMore).dialog('open'); 
		$(fPanelMore).dialog('refresh', `formulas/${htmlFile}.html`);
	}
}

/**
 * @abstract The KIHWindow class.
 * 
 * This represents windows like the Configuration Parameters window, the Language Configuration
 * window or the Theme (Style) selection window.
 */
class KIHWindow extends KIHPanel {

	/**
	 * @abstract Constructor
	 */
	constructor(id, parent) {
		super(id, parent);
				
	}
	
	/**
	 * @abstract Initialises (creates) a window.
	 * 
	 * This is an adaptation of the KIHPanel version. It is able to provide a localized title
	 * that would otherwise disappear.
	 * 
	 * TODO: harmonize with More Dialog class.
	 */
	async initialise() {
		var handlers = this.handlers;
		handlers.title = this.localizeOption('title');
		$(`#${this.id}`).window(handlers)
	}
	
	/**
	 * @abstract Shows the *Window* and resizes (Position, Size) it to stored values.
	 * 
	 * This is an adaptation of the KIHPanel version for KIHWindow.
	 */
	async show() {
		this.resize();
		this.open();		
	}

	/**
	 * @abstract Opens (shows) this window.
	 */
	open() {
		$(`#${this.id}`).window('open');
	}

	/**
	 * @abstract Used to localize an option.
	 */	
	localizeOption(option) {
		var text = $(`#${this.id}`).window('options')[option];							// do something to preserve the TITLE: this is an option
		var html = $.parseHTML(text);													// parse it into html object
		var key = $(html).attr('locate');												// extract the locate attribute
		var located = this.parent.localizer.getLocalText(key);							// use it to get localized text
		html = $(html).html(located)[0].outerHTML;										// insert it into orginal html
		return html;
	}
}


/**
 * @abstract This class is solely responsible for the Dynamic Panel for Custom Equations.
 */
class DynamicPanel extends KIHPanel {
	parent = null;
	messager = null;
	utilities = null;
	panelId = "";
	gridSelector = "";
	gridSelectorOfCopy = "";
	initialised = false;
	renderComplete = false;
	sortOrderAsc = 'desc';
	
	/**
	 * @abstract Constructor.
	 */
	constructor(parent) {
		var panelId = 'wf_CUSTOM_EQUATIONS_MORE';
		super(panelId, parent);
		this.panelId = panelId;
		this.parent = parent;
		this.messager = new Messager(this.parent.localizer);
		this.utilities = new Utilities(this.parent.localizer);
		this.gridSelector = `#${panelId} .easyui-datagrid`;
		this.gridSelectorOfCopy = `#${panelId} table:not(.easyui-datagrid)`;
		
		this.parent.localizer.subscribe(this.onLocaleChanged.bind(this));
	}
	
	/**
	 * @abstract An Observer for the Locale Changed notifications.
	 * 
	 * This changes all localized text in the dialog.
	 */
	async onLocaleChanged(localizer) {
		console.debug(`onLocaleChanged : ${localizer.currentLocale} `);

		$('span[locate].custom-equations')
		.each(
			function() { 
				console.debug(`Custom-Equations: ${$(this).attr("locate")}`);
				if (typeof ($(this).attr("locate")) != "undefined") { 
					var localText = localizer.getLocalText($(this).attr("locate")); 
					if (typeof (localText) != "undefined") $(this).html(localText); 
				} 
			}); 
	}	

	/**
	 * @abstract It is intended to create this Panel dynamically taking the content from the Settings.
	 */
	async initialise() {
		var inst = this;
		var fPanelMoreID = this.panelId;
		
		console.debug(`Here in DynamicPanel.initialise 1`);
		
		await super.initialise();

		console.debug(`Here in DynamicPanel.initialise 2`);
		await inst.initialiseDatagrid(`${inst.gridSelector}`);
		await inst.customEquationsFromParameters();

		// TODO: pagination bar adaptation		
		// Building the dialog more than once was not the intention, but this comes at a low
		// price and enables language update of the pagination bar over invocations.

		$('#btCUSTOM_EQUATIONS_ADD')
		.click(async function(event) { 
			event.preventDefault();
			
			var selectedText = inst.parent.codeMirror.getSelection();
			if (selectedText != "") {
				inst.addEquation('Placeholder', selectedText);
				inst.editCell();
				await inst.onAfterRender();
			} else {
				
				inst.messager.show('FORMULA_EDITOR', 'NO_SELECTION_TEXT');
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
				dg.datagrid('deleteRow', cell.index)
				.datagrid('acceptChanges', {});
				this.customEquationsToParameters();
			} else {
				inst.messager.show('FORMULA_EDITOR', 'NO_SELECTION_CELL');
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
			await inst.fromJson(json);
			await inst.onAfterRender();
		});
	}
	
	async show() {
		await this.onLocaleChanged(this.parent.localizer);			// TODO: does not help for pagination
		await super.show();
	}
	
	/**
	 * Reads the Custom Equations from the parameters.
	 */
	async customEquationsFromParameters() {
		try {
			await this.fromJson(JSON.stringify(this.parent.parameters.equationCollection));
			$(this.gridSelector).datagrid('doFilter');
		} catch(e) {
			
		}
	}

	/**
	 * @abstract Called after each change of the content writes the Custom Equations back to the parameters.
	 */	
	customEquationsToParameters() {
		var customEquations = this.toJson();
		this.parent.parameters.equationCollection = customEquations;		
		this.parent.parameters.writeParameters();
	}
	
	/**
	 * Uses the given JSON compatible data to fill the data grid.
	 * 
	 * @param json - a json string used to fill the data grid
	 */
	async fromJson(json) {
		$(this.gridSelector)
		.datagrid('loadData', []);
		
		try {
			var equations = JSON.parse(json);
			for (const equation of equations) {
				if (typeof(equation[1]) == "string" && equation[1] != "[object Object]") {
					this.addEquation(equation[0], equation[1]);
				}
			}
		} catch(e) {
			this.messager.error('LOAD_ERROR', e);
		}
	}
	
	/**
	 * @abstract Reads the Equations from data grid and returns them.
	 * 
	 * @returns An array of the equations, JSON compatible
	 */
	toJson() {
		var data = $(this.gridSelector)
		.datagrid('getData');
		
		var customEquations = data.rows.map(function(row) {
			var title = row.title;
			var fragment = $.parseHTML(row.formula)[0];
			var formula = fragment.attributes['latex'].value;
			return [ title, formula ];
		})
		
		return customEquations;
	}
	
	/**
	 * @abstract Adds an Equation to the grid.
	 * 
	 * @param title - the title of the equation
	 * @param formula - the formula itself
	 */
	addEquation(title, formula) {
		$(this.gridSelector)
		.datagrid(
			'appendRow', {
			title: title,
			formula: this.buildAnchor(formula)	 
		})
		.datagrid('acceptChanges', {});
	}
	
	/**
	 * @abstract Equips the datagrid (after render update).
	 * 
	 * a.) inplace update of the content
	 * b.) row height fixing
	 * c.) saving of equations
	 */
	async onAfterRender() {
		var anchor = $(`${this.gridSelectorOfCopy} a`);
		this.parent.inplaceUpdate(anchor, true);
		$(this.gridSelector).datagrid('fixRowHeight');
		this.customEquationsToParameters();
	}
	
	/**
	 * @abstract Initiates cell editing.
	 */
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
	 * @abstract Builds a single Anchor from formula.
	 * 
	 * @param formula - the formula is capable of providing an interactive anchor
	 * @returns - the calculated anchor
	 */
	buildAnchor(formula) {
		var title = `<span style='background:yellow; color: brown;'>${formula}</span>`;
		return `<a style="text-align:left;" href="#" class="s easyui-tooltip" title="${title}" latex="${formula}">$${formula}$</a>`;
	}

	/**
	 * @abstract Compares 2 items of the datagrid for sorting.
	 * 
	 * WORKS. Must observe the contract with the sorting API.
	 * 
	 * @param a - item 1
	 * @param b - item 2
	 * @returns -1 for a < b and +1 for a >= b;
	 */
	alphaSorter(a, b) {
		console.debug(`SORT comparing ${a} < ${b}, order: ${this.sortOrderAsc}`);
		return a < b ? -1 : +1;
	}
	
	/**
	 * @abstract Initialises a Data Grid given by the selector
	 */
	async initialiseDatagrid(selector) {
		var inst = this;
		var filterPrompt = inst.parent.localizer.getLocalText('FILTER_PROMPT');
		console.debug(`initialiseDatagrid for ${selector}`);
		$(selector)
		.datagrid({
			remoteSort: false,
			remoteFilter: false,
			pagination: true,
			rownumbers: true,
			fit: true,
			onAfterEdit: async function(idx, row, changes) {
				console.debug(`onAfterEdit for ${selector}`);
				await inst.onAfterRender();
				return true;
			},
			onCancelEdit: async function(idx, row) {
				console.debug(`onCancelEdit for ${selector}`);
				await inst.onAfterRender();
				return true;
			},
			clickToEdit: false,
			dblclickToEdit: true,
			columns: [[
				{ field: 'title', title: '<span class="custom-equations" locate="TITLE">Title</span>', width: '40%', editor: 'text', sortable: true, sorter: inst.alphaSorter.bind(inst) },
				{ field:'formula', title: '<span class="custom-equations" locate="FORMULA">Formula</span>', width:'60%' }
			]],
			onBeforeSortColumn: function(sort, order) {
				console.debug(`Sort order is: ${order}`);
				inst.sortOrderAsc = order;
				return true;
			}
		});
		inst.equipDatagridWithInteractivity();								// TODO: is this a better place?
		$(selector)
		.datagrid('enableCellEditing')
		.datagrid('gotoCell', {
            index: 0,
            field: 'title'
    	})
    	.datagrid(await inst.viewRender())									// adds onAfterRender to view
		.datagrid('enableFilter', [
			{
				field: 'title',
				type: 'textbox',
				options: {
					prompt: filterPrompt
				}
			}
		])
		.datagrid('addFilterRule', {
			field: 'title',
			op: 'contains',
			value: ''
		});
		// inst.equipDatagridWithInteractivity();
	}
	
	/**
	 * @abstract Returns an object with view property, assigning overrides for render methods.
	 */
	async viewRender() {
		var inst = this;
		return {
			view: $.extend(true, {}, $.fn.datagrid.defaults.view, {
				render: async function(target, container, frozen){
					$.fn.datagrid.defaults.view.render.call(this, target, container, frozen);
					console.log('Render');
				},
				onBeforeRender: async function(target){
					$.fn.datagrid.defaults.view.onBeforeRender.call(this, target);
					console.log('Before render');
				},
				onAfterRender: async function(target){
					$.fn.datagrid.defaults.view.onAfterRender.call(this, target);
					await inst.onAfterRender();
					console.log('After render');
				}
			})
		};
	}

	/**
	 * @abstract Equips the data grid anchors with interactivity. 
	 * 
	 * This is necessary because original event handlers
	 * do not stay active after changes.
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
				console.debug(`Click on equation: ${latex}`);
				if (latex != undefined) { 
					inst.parent.insert(latex); 
				} else { 
					$.messager.show({ 
						title: "<span class='rtl-title-withicon'>" + inst.parent.localizer.getLocalText("INFORMATION") + "</span>", 
						msg: inst.parent.localizer.getLocalText("NO_LATEX") 
					}); 
				}
				// return true;
			});
		} catch(e) {
			console.error(`Katex: equipDatagridWithInteractivity : ${e}`);
		}
	}
}

/**
 * @abstract The KIHPanels container for all Panels.
 * 
 * This hosts all Panel derived instances and is able to *show* them with a specialized method.
 * This method performs an initialisation lazily and one time and can show the Panel repeatedly.
 * Client is the central *Katex Input Helper* instance.
 */
class KIHPanels {
	parameters = null;
	localizer = null;
	messager = null;
	panels = { };
	
	/**
	 * @abstract Constructor
	 */
	constructor(parameters, localizer) {
		this.parameters = parameters;
		this.localizer = localizer;
		this.messager = new Messager(localizer);
	}
	
	async showPanel(id) {
		if (!(id in this.panels)) {
			this.panels[id] = new KIHPanel(id, this);
			await this.initialise(id);
		}
		await this.show(id);
	}

	async showMoreDialog(id, initialiseSymbolContent) {
		if (!(id in this.panels)) {
			this.panels[id] = new KIHMoreDialog(id, this);
			await this.initialise(id, initialiseSymbolContent);
		}
		await this.show(id);
	}
	
	async showWindow(id) {
		if (!(id in this.panels)) {
			this.panels[id] = new KIHWindow(id, this);
			await this.initialise(id);
		}
		await this.show(id);
	}
	
	async showDynamicPanel(math) {
		var id = 'wf_CUSTOM_EQUATIONS_MORE';
		if (!(id in this.panels)) {
			this.panels[id] = new DynamicPanel(math);
			await this.initialise(id);
		}
		await this.show(id);
	}
	
	async initialise(id, initialiseSymbolContent = null) {
		await this.panels[id].initialise(initialiseSymbolContent);
	}
	
	async show(id) {
		await this.panels[id].show();
	}
}
