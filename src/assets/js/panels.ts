import { CategoriesTree } from './categoriesTree';
import { FileHandler } from './fileHandling';

import { inject, injectable, injectFromBase } from 'inversify';
import { ILocalizer, IParser, IMath, utilitiesId, IUtilities, categoriesTreeId, ICategoriesTree,
	IMessager, dynamicParametersId, panelFactoryId, IPanel } from './interfaces';

/**
 * The base class of all Panels, Dialogs, Windows.
 */
export class KIHPanel implements IPanel {
	id = "";
	parent = null;
	initialised = false;
	isOpen = false;
	math: IMath = null;;
	localizer: ILocalizer = null;
	parameters: any = null;
	messager: IMessager = null;
	parser: IParser = null;
	
	/**
	 * Constructor
	 *
	 */
	constructor(
		@inject(dynamicParametersId)params: any
	) {	
		const [ math, localizer, parameters, messager, parser, id, parent ] = params;
		this.math = math;
		this.localizer = localizer;
		this.parameters = parameters;
		this.messager = messager;
		this.parser = parser;
		this.id = id;
		this.parent = parent;
	}	
	
	/**
	 * The handler of move events, invoked when the panel is moved.
	 * 
	 * This delegates to the *Parameters* instance.
	 */
	onMove(left: number, top: number) { 
		console.info(`Panel with id ${this.id} moved : ${left}, ${top}`);
		this.parameters.onPanelMove(this.id, left, top);
	}
	
	/**
	 * The handler of resize events, invoked when the panel is resized.
	 * 
	 * This delegates to the *Parameters* instance.
	 */
	onResize(width: number, height: number) {
		console.info(`Panel with id ${this.id} resized : ${width}, ${height}`);
		this.parameters.onPanelResize(this.id, width, height);
	}
	
	/**
	 * Called if a window is closed.
	 */
	onClose() {
		this.isOpen = false;
	}
	
	/**
	 * Builds an object from the events to be provided when the panel is created.
	 */
	get handlers() {
		return {
			onMove: this.onMove.bind(this),
			onResize: this.onResize.bind(this),
			onClose: this.onClose.bind(this)
		};
	}
	
	/**
	 * Initialise method, creates the *Panel* with the handlers provided.
	 */
	async initialise(dummy: any = null) {
		$(`#${this.id}`).dialog(this.handlers)
	}
	
	/**
	 * Virtual method. Updates a panel. F.i. used for Information Window.
	 */
	async update(...params) : Promise<void> {
		
	}
	
	/**
	 * Shows the *Panel* and resizes (Position, Size) it to stored values.
	 */
	async show() {
		this.resize();
		this.open();
	}

	/**
	 * Resizes this panel with the values in parameters.
	 */
	resize() {
		this.parameters.resizePanel(this.id);
	}
	
	/**
	 * Opens (shows) the Panel.
	 */
	open() {
		$(`#${this.id}`).dialog('open');
		this.isOpen = true;
	}
	
	/**
	 * Toggles the dialog between open and closed
	 */
	toggle() {
		if (this.isOpen) {
			$(`#${this.id}`).dialog('close');
			this.isOpen = false;
		} else {
			this.show();
		}
	}

	/**
	 * Used to localize an option.
	 * 
	 * Place this service into this base class to get access everywhere.
	 * TODO: use Utility function.
	 */	
	localizeOption(option: string, id = null, func = $.fn.panel) {
		id = id || this.id;
		let text = func.bind($(`#${id}`))('options')[option];							// do something to preserve the TITLE: this is an option
		let html = $.parseHTML(text);													// parse it into html object
		let key = $(html).attr('locate');												// extract the locate attribute
		let located = this.localizer.getLocalText(key);									// use it to get localized text
		let htmlString = (($(html).html(located)[0] as any) as Element).outerHTML;		// insert it into orginal html
		return htmlString;
	}

	/**
	 * Sets the Focus to Editor window thus enabling key clicks.
	 */	
	protected focus() {
		this.math.codeMirror.focus();
	}

	/**
	 * Updates the output area with Editor content.
	 */
	protected updateOutput() {
		this.math.updateOutput();
	}
	
	/**
	 * Inserts a string into the Editor.
	 */
	protected insert(b: string) {
		this.math.insert(b);
		this.focus();
	}	
}

/**
 * The More Dialog class.
 * 
 * This represents dialogs with Math content which is loaded on demand when the dialog is opened.
 * This content is in Katex format and will be translated to Math.
 * 
 * @extends KIHPanel
 */
@injectFromBase() export class KIHMoreDialog extends KIHPanel {
	
	/**
	 * Initialises (creates) the dialog.
	 * 
	 * This additionally to the *super* class method provides a translation method and a title for
	 * Katex to Math in-place translation.
	 * 
	 * @param initialiseSymbolContent - method of the client to be invoked during loading
	 */
	override async initialise(initialiseSymbolContent: any) {
		// id is the MORE id as in dialog.html file with 'w' and '_MORE'
		let fPanelMoreID = this.id;
		let fPanelMore = $('#' + fPanelMoreID);
		let htmlFile = fPanelMoreID.substring(1); 
		
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
 * The KIHWindow class.
 * 
 * This represents windows like the Configuration Parameters window, the Language Configuration
 * window or the Theme (Style) selection window.
 */
@injectFromBase() export class KIHWindow extends KIHPanel {
	
	/**
	 * Initialises (creates) a window.
	 * 
	 * This is an adaptation of the KIHPanel version. It is able to provide a localized title
	 * that would otherwise disappear.
	 * 
	 * TODO: harmonize with More Dialog class.
	 */
	override async initialise(dummy: any = null) {
		let handlers: any = this.handlers;
		handlers.title = this.localizeOption('title');
		$(`#${this.id}`).window(handlers);
	}
	
	/**
	 * Shows the *Window* and resizes (Position, Size) it to stored values.
	 * 
	 * This is an adaptation of the KIHPanel version for KIHWindow.
	 */
	async show() {
		this.resize();
		this.open();		
	}

	/**
	 * Opens (shows) this window.
	 */
	open() {
		$(`#${this.id}`).window('open');
		this.isOpen = true;
	}
}

/**
 * The Information window. Additionally to an ordinary window this also handles
 * tabs (tab is here a tab index).
 */
@injectFromBase() export class InformationWindow extends KIHWindow {
	tab: number = 0;
	tabChanged = false;

	/**
	 * Initialises the Matrix window.
	 */
	override async initialise(...params) : Promise<void> {
		await super.initialise();
		let [ tab ] = params;
		this.tab = tab;
	}
	
	/**
	 * The update method handles tab changes. This merely sets a flag indicating
	 * the change.
	 */
	override async update(...params) : Promise<void> {
		let [ tab ] = params;
		this.tabChanged = tab != this.tab;
		this.tab = tab;
	}
	
	/**
	 * The toggle method switches the isOpen state, but only if no tab switch took
	 * place. In this case the tab is switched.
	 */
	override async toggle() {
		if (!this.tabChanged || !this.isOpen) {
			await super.toggle();
		}
		$('#tINFORMATIONS').tabs('select', this.tab); 			
		this.tabChanged = false;
	}
}

/**
 * The Matrix window is a special Window with extra functionality.
 */
@injectable() 
@injectFromBase() export class MatrixWindow extends KIHWindow {
	
	/**
	 * Initialises the Matrix window.
	 */
	override async initialise(...params) : Promise<void> {
		await super.initialise();

		let vme = this;
		
		$('#btMATRIX_CLOSE').on('click', function(event) { 
			event.preventDefault(); 
			vme.toggle();										// direct 'close' does not trigger onClose 
			vme.focus(); 
		}); 
		$('#btMATRIX_SET').on('click', function(event) { 
			event.preventDefault(); 
			if (vme.setLatexMatrixInEditor()) {
				vme.updateOutput(); 
				vme.toggle();									// direct 'close' does not trigger onClose 
				vme.focus(); 
			} 
		}); 
		$('#colsMATRIX, #rowsMATRIX').on('keyup', function(event) { 
			vme.updateMatrixWindow(); 
		});
		
	}

	/**
	 * Updates a Panel with new data. Here used to set rows and columns.
	 */	
	override async update(...params) {
		let [ rows, cols ] = params;	
		await this.updateMatrixWindow(rows, cols);
	}

	/**
	 * Updates the Matrix window with given rows and columns values.
	 * 
	 * @param rows - the number of matrix rows 
	 * @param cols - the number of matrix columns
	 */
	async updateMatrixWindow(rows: number = undefined, cols: number = undefined) {
		let vme = this;
		if (typeof rows != "undefined" && rows != null) document.formMATRIX.rowsMATRIX.value = rows; 
		if (typeof cols != "undefined" && cols != null) document.formMATRIX.colsMATRIX.value = cols; 
		rows = document.formMATRIX.rowsMATRIX.value; 
		cols = document.formMATRIX.colsMATRIX.value; 
		
		// build a table with rows and columns and display it
		let html = '<table style="border-spacing:0px; border-collapse:collapse;">'; 
		let r: number, c: number, value: string; 
		for (r = 1; r <= rows; r++) {
			html += "<tr>"; 
			for (c = 1; c <= cols; c++) {
				value = (`a_{${r}${c}}`);
				html = html + `<td><input type='text' size='5' name='a_${r}${c}' value='${value}'/></td>`;
			}
			html += "</tr>";
		}
		html += "</table>"; 
		$("#showMATRIX").html(html); 
		await this.parser.parseAsync('#wMATRIX');										// after dynamically set the content
		$('#wMATRIX').dialog('open');
		
		// adapt the size of this wMATRIX window to fit the content
		let width = 20 + $("#tableMATRIX").width(); 
		let height = 100 + $("#tableMATRIX").height(); 
		width = Math.max(width, 280); 
		height = Math.max(height, 160);
		
		let options = $('#wMATRIX').dialog('options');
		$('#wMATRIX').dialog({ 
			title: vme.localizer.getLocalText("MATRIX"), 
			width: width, 
			height: height,
			left: options.left,									// HAS NO EFFECT !!
			top: options.top 
		}); 
		$('#wMATRIX').dialog('open');
	}
	
	/**
	 * Transfers the Matrix displayed in the Matrix window to the Editor.
	 */
	setLatexMatrixInEditor() : boolean {
		
		let vme = this; 
		let cols = document.formMATRIX.colsMATRIX.value; 
		let rows = document.formMATRIX.rowsMATRIX.value; 
		let left = document.formMATRIX.leftbracketMATRIX.value; 
		let right = document.formMATRIX.rightbracketMATRIX.value; 
		
		if ((left == '{:') != (right == ':}')) {
			this.messager.show('KATEX', 'ONE_BRACKET_MISSING');
			return false;
		}
		
		/** 
		 * Builds Latex formula for "Matrix Table"
		 */
		function matrixTable(rows: number, cols: number) : string {
			let formula = ""; 
			for (let r = 1; r <= rows; r++) {
				for (let c = 1; c <= cols; c++) { 
					eval("formula = formula + document.formMATRIX.a_" + r + c + ".value"); 
					if (c < cols) formula += " & "; 
				}
				if (r < rows) formula += " \\\\ ";
			}
			
			return formula;
		}
		
		/**
		 * Build Left bracket. Changed and tested.
		 */
		function leftBracket(left: string) : string {
			let lbr = "";
			switch (left) {
				case "{:": break;
				case "{":
				case "}": lbr = `\\left\\${left}`; break; 
				case "||": lbr = "\\left\\|"; break;
				case "(:": lbr = "\\left\\langle"; break;
				case ":)": lbr = "\\left\\rangle"; break;
				default: lbr = `\\left${left}`
			}
			return lbr; 
		}
	
		/**
		 * Build Right bracket. Changed and tested.
		 */
		function rightBracket(right: string) : string {
			let rbr = "";
			switch (right) {
				case ":}": break;
				case "{":
				case "}": rbr = `\\right\\${right}`; break; 
				case "||": rbr = "\\right\\|"; break;
				case "(:": rbr = "\\right\\langle"; break;
				case ":)": rbr = "\\right\\rangle"; break;
				default: rbr = `\\right${right}`
			}
			
			return rbr;			
		}
		
		// build the final Matrix by adding brackets
		let matrix = leftBracket(left);		
		matrix += " \\begin{matrix} "; 
		matrix += matrixTable(rows, cols); 
		matrix += " \\end{matrix} ";
		matrix += rightBracket(right); 
		matrix += " "; 
		vme.insert(matrix);
		
		return true;
	}
}

/**
 * Represents the Unicode window.
 */
@injectFromBase() export class UnicodeWindow extends KIHWindow {

	uniCodesListLoaded = false;
	initialiseSymbolContent: any = null;

	/**
	 * Initialises the Unicode List.
	 */
	override async initialise(...params: any) : Promise<void> {
		await super.initialise();
		[ this.initialiseSymbolContent ] = params;
		
		let vme = this;
		function prependNumber(j: number) {
			return String(j).padStart(3, "0");
		} 

		if (!this.uniCodesListLoaded) {
			this.uniCodesListLoaded = true; 
			$('#unicodeChoise').combobox({ 
				valueField: 'value', 
				textField: 'text', 
				onSelect: async function(record) { 
					/**
					 * Hex to decimal conversion.
					 */
					function h2d(h: string) { return parseInt(h, 16); }
					let range = record.value.split(","); 
					await vme.setUniCodesValues(h2d(range[0]), h2d(range[1])); 
				}, 
				onLoadSuccess: async function() { 
					$(this).combobox("select", "0x25A0,0x25FF"); 
					await vme.setUniCodesValues(0x25A0, 0x25FF); 
				} 
			});

			let html = "<table><caption>[0x0000,0xFFFF]</caption>"; 
			for (let i = 0; i <= 650; i = i + 10) {
				html += "\n<tr>"; 
				for (let j = i; j < i + 10; j++) { 
					if (j > 655) break;
					let cellDec = prependNumber(j);
					html += `<td><a style='border:1px solid #f0f0f0;' class='s' href='#'>${cellDec}</a></td>`; 
				}
				html += "</tr>";
			}
			html = html + "\n</table>"; 
			$("#cUNICODES_LIST").html(html);
			$("#cUNICODES_LIST a.s")
			.on('click', async function(event) {
				event.preventDefault();
				let j = parseInt($(this).text());
				await vme.selectUniCodesValues(((j * 100) + 1), ((j + 1) * 100));
				return false;	
			}); 
			let json = await import(
				/* webpackInclude: /\.json$/ */
				`../formulas/unicodeChoiseData.json`);
			$('#unicodeChoise').combobox('loadData', json);
		}
	}

	/**
	 * Selects a range of Unicode Characters and inserts it in a table.
	 */
	private async selectUniCodesValues(i1: number, i2: number) { 
		$('#unicodeChoise').combobox("select", ""); 
		await this.setUniCodesValues(i1, i2, true); 
	}
	
	/**
	 * Inserts a range of Unicode Characters for display in the table.
	 * 
	 * @param i1 - start number
	 * @param i2  - end number (inclusive)
	 * @param breakFFFF - breaks rendering above 0xFFFF
	 */
	private async setUniCodesValues(i1: number, i2: number, breakFFFF = false) {
		/**
		 * Decimal to hex conversion.
		 */
		function d2h(d: number) { return d.toString(16).toUpperCase(); }
		
		let html = ("<table border='1' cellspacing='0' style='border-spacing:0px;border-collapse:collapse;'>"); 
		html += `
			<tr>
				<th><span locate='UNICODES_INPUT'>${this.localizer.getLocalText("UNICODES_INPUT")}</span></th>
				<th>HEXA</th>
				<th><span locate='OUTPUT'>${this.localizer.getLocalText("OUTPUT")}</span></th>
			</tr>
		`;
		for (let i = i1; i <= i2; i++) { 
			if (breakFFFF && i > 65535) break; 
			html += `
				<tr>
					<td>${i}</td>
					<td style='text-align:center;'>${d2h(i)}</td>
					<td style='font-size:150%;text-align:center;'>
						<a href='#' class='s' latex='\\char"${d2h(i)} '>&#${i};</a>
					</td>
				</tr> 
			`;
		}
		html = html + "\n</table>"; 
		$("#cUNICODES_VALUES").html(html); 
		$("#cUNICODES_VALUES").scrollTop(0);
		if (this.uniCodesListLoaded && this.initialiseSymbolContent != null) {
			await this.initialiseSymbolContent("cUNICODES_VALUES");
		}
	}
}


/**
 * This class is solely responsible for the Dynamic Panel for Custom Equations.
 */
@injectFromBase({extendProperties: false}) export class DynamicPanel extends KIHPanel {
	
	@inject(utilitiesId) utilities: IUtilities;
	@inject(categoriesTreeId) categoriesTree: ICategoriesTree;
	gridSelector = "";
	gridSelectorOfCopy = "";
	treeSelector = "";
	initialised = false;
	renderComplete = false;
	sortOrderAsc = 'desc';
	
	/**
	 * Constructor.
	 */
	constructor(
		@inject(dynamicParametersId)params: any
	) {
		super(params);
		this.gridSelector = `#${this.id} .easyui-datagrid`;
		this.gridSelectorOfCopy = `#${this.id} table:not(.easyui-datagrid)`;
		this.treeSelector = `#categories`;
		
		this.localizer.subscribe(this.onLocaleChanged.bind(this));
	}
	
	/**
	 * An Observer for the Locale Changed notifications.
	 * 
	 * This changes all localized text in the dialog.
	 */
	async onLocaleChanged(localizer) {
		let inst = this;
		console.debug(`DynamicPanel.onLocaleChanged : ${localizer.currentLocale} `);

		$('span[locate].custom-equations')											// span elements in html
		.each(function() { 
			if (typeof ($(this).attr("locate")) != "undefined") { 
				let localText = localizer.getLocalText($(this).attr("locate")); 
				if (typeof (localText) != "undefined") $(this).html(localText); 
			} 
		});
		
		$('.custom-equations:not(span)')											// the spans are embedded in titles (tooltips)
		.each(function() {
			if ($(this).hasClass('easyui-tooltip')) {
				try {
					let id = $(this).attr('id');
					let title = inst.localizeOption('content', id, $.fn.tooltip);
					$(this).tooltip({
						content: title,
						onShow: function() {
							console.debug(`Tooltip %o`, $(this).tooltip('tip'));
							$(this).tooltip('tip').css({ 
								'z-index': 500000, 									// always above all ui elements!
								maxWidth: 300 
							});
						}
					});
				} catch(e) {
					console.warn(`easyui-tooltip warning : ${e}`);
				}
			}
		});
	}	

	/**
	 * It is intended to create this Panel dynamically taking the content from the Settings.
	 */
	override async initialise(dummy: any = null) {
		let inst = this;
		
		// subscribe to Tree observables here because in ctor property injection is done
		this.categoriesTree.nodeSelected.subscribe(this.onNodeSelected.bind(this));
		this.categoriesTree.treeChanged.subscribe(this.onTreeChanged.bind(this));
		this.categoriesTree.equationMoved.subscribe(this.onEquationMoved.bind(this));
		
		await super.initialise();
		await inst.initialiseDatagrid(`${inst.gridSelector}`);
		await inst.customEquationsFromParameters();

		// TODO: pagination bar adaptation		
		// Building the dialog more than once was not the intention, but this comes at a low
		// price and enables language update of the pagination bar over invocations.

		$('#btCUSTOM_EQUATIONS_ADD')
		.click(async function(event) { 
			event.preventDefault();
			
			let selectedText = inst.math.codeMirror.getSelection();
			if (selectedText != "") {
				inst.addEquation('Placeholder', selectedText);
				inst.onAfterRender();
				inst.editCell();														// attention! order reversed
			} else {
				
				inst.messager.show('FORMULA_EDITOR', 'NO_SELECTION_TEXT');
			}
		});
	
		$('#btCUSTOM_EQUATIONS_REMOVE')
		.click(async function(event) { 
			event.preventDefault();
			let checkedEquations = inst.categoriesTree.getCheckedEquations();			// indices of checked equations
			let from = inst.categoriesTree.currentLeaf;									// the currrent set
			if (from !== null && checkedEquations.length > 0) {							// remove configured?
				inst.categoriesTree.deleteEquations(from.attributes, checkedEquations); // -> then delete the checked equations
				inst.clearCheckedAndUpdate();
			} else {
				inst.messager.show('FORMULA_EDITOR', 'NO_SELECTION_CELL');
			}
		});
	
		$('#btCUSTOM_EQUATIONS_SAVE')
		.click(async function(event) {
			event.preventDefault();
			console.info('Click on btCUSTOM_EQUATIONS_SAVE');
			inst.categoriesTree.currentEquations = inst.toJson();
			let data = JSON.stringify(inst.categoriesTree.customEquationsProxy);			// must be a JSON string
			let type = 'application/json';
			
			let fileHandler = new FileHandler();
			fileHandler.saveFile(data, type, "fSAVE_CUSTOM_EQUATIONS");
		});
	
		$('#btCUSTOM_EQUATIONS_LOAD')
		.click(async function(event) {
			event.preventDefault();
			let fileHandler = new FileHandler();
			let json = await fileHandler.loadFile("fOPEN_CUSTOM_EQUATIONS");
			await inst.categoriesTree.setCustomEquations(JSON.parse(json));
			inst.fromJson(inst.categoriesTree.currentEquations);
			inst.onAfterRender();
		});
		
		$('#CUSTOM_EQUATIONS_LAYOUT').layout({fit: true});
	}
	
	/**
	 * Show override of the base class for localization.
	 */
	async show() {
		// Order changed to initialize span[locate]? -> changes nothing in appearance
		await super.show();
		await this.onLocaleChanged(this.localizer);			// Does not help for pagination
	}
	
	/**
	 * Observer of *Category Tree* observable.
	 */
	onTreeChanged(node) {
		this.customEquationsToParameters();
	}

	/**
	 * Observer of *Category Tree* observable.
	 */
	onEquationMoved() {
		this.clearCheckedAndUpdate();
	}
	
	/**
	 * Observer of *Category Tree* observable.
	 */
	onNodeSelected(equations) {
		try {
			this.fromJson(equations);
			$(this.gridSelector).datagrid('doFilter');
		} catch(e) {
			
		}
		this.customEquationsToParameters();
	}
	
	/**
	 * Clears the checked checkboxes in datagrid and updates the latter.
	 */
	clearCheckedAndUpdate() {
		try {
			$(this.gridSelector).datagrid('clearChecked');			// does this clear all checks (not the rows itselfs)?
			this.fromJson(this.categoriesTree.currentEquations);
			$(this.gridSelector).datagrid('doFilter');
		} catch(e) {
			
		}
		this.customEquationsToParameters();
	}
	
	/**
	 * Reads the Custom Equations from the parameters.
	 */
	async customEquationsFromParameters() {
		try {
			await this.categoriesTree.setCustomEquations(this.parameters.equationCollection);
			this.fromJson(this.categoriesTree.currentEquations);
			$(this.gridSelector).datagrid('doFilter');
		} catch(e) {
			
		}
	}

	/**
	 * Called after each change of the content writes the Custom Equations back to the parameters.
	 */	
	customEquationsToParameters() {
		this.categoriesTree.currentEquations = this.toJson();
		this.parameters.equationCollection = this.categoriesTree.customEquationsProxy;		
		// Writing to parameters DOES initiate writeParameters !!
		// this.parameters.writeParameters();
	}
	
	/**
	 * Uses the given JSON compatible data to fill the data grid.
	 * 
	 * @param json - a json object used to fill the data grid
	 */
	fromJson(json) {
		$(this.gridSelector)
		.datagrid('loadData', []);
		let id = 0;
		
		try {
			let equations = json;
			for (const equation of equations) {
				if (typeof(equation[1]) == "string" && equation[1] != "[object Object]") {
					this.addEquation(equation[0], equation[1], ++id);
				}
			}
		} catch(e) {
			this.messager.error('LOAD_ERROR', e);
		}
	}
	
	/**
	 * Reads the Equations from data grid and returns them.
	 * 
	 * These are all equations now but filtered, if a filter is active.
	 * 
	 * @returns An array of the equations, JSON compatible
	 */
	toJson() {
		let data = $(this.gridSelector)
		.datagrid('doFilter')
		.datagrid('getData');
		
		let customEquations = data.filterRows.map(function(row) {
			let title = row.title;
			let fragment = $.parseHTML(row.formula)[0] as HTMLElement;
			let formula = fragment.attributes['latex'].value;
			return [ title, formula ];
		});
		
		return customEquations;
	}
	
	/**
	 * A test to get all data rows.
	 * 
	 * No longer needed, only for illustration purposes.
	 */
	test() {
		
		let pager = $(this.gridSelector).datagrid('getPager');
		let options = pager.pagination('options');
		let total = options.total;
		let pageSize = options.pageSize;
		
		let rows = [];
		for (let page = 1, remaining = total; remaining > 0; page++, remaining -= pageSize) {
			$(this.gridSelector).datagrid('gotoPage', page);
			pager.pagination('refresh');
			let pageRows = $(this.gridSelector).datagrid('getData').rows;
			rows = rows.concat(pageRows);
		}
		
		console.debug(`test-read : read ${rows.length} of ${options.total} `);
	}
	
	/**
	 * Checks if a filter is active in the datagrid.
	 * 
	 * @returns true, if so
	 */
	filterActive() {
		let pager = $(this.gridSelector).datagrid('getPager');
		let options = pager.pagination('options');
		let total = options.total;
		let rows = $(this.gridSelector).datagrid('getData').filterRows;
		
		return rows.length < total;
	}
	
	/**
	 * Determines the first free id for the id field making it unique.
	 */
	freeId() {
		let data = $(this.gridSelector)
		.datagrid('getData');

		let ids = data.filterRows.map(row => row.id);
		return Math.max(ids) + 1;
	}
	
	/**
	 * Adds an Equation to the grid.
	 * 
	 * @param title - the title of the equation
	 * @param formula - the formula itself in katex format
	 */
	addEquation(title, formula, id = -1) {
		$(this.gridSelector)
		.datagrid(
			'appendRow', {
			id: id == -1 ? this.freeId() : id,
			title: title,
			formula: this.buildAnchor(formula)	 
		})
		.datagrid('acceptChanges', {});
	}
	
	/**
	 * Equips the datagrid (after render update).
	 * 
	 * - inplace update of the content
	 * - row height fixing
	 * - saving of equations
	 */
	onAfterRender(withParametersUpdate = true) {
		let anchor = $(`${this.gridSelectorOfCopy} a`);
		this.math.inplaceUpdate(anchor, true);
		$(this.gridSelector).datagrid('fixRowHeight');
		if (withParametersUpdate) this.customEquationsToParameters();
	}
	
	/**
	 * Initiates cell editing.
	 */
	editCell(index = -1) {
		if (index == -1) {
			index = $(this.gridSelector).datagrid('getRows').length - 1;
		}
		
		let input = $(this.gridSelector)
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
	 * 
	 * @param formula - the formula is capable of providing an interactive anchor
	 * @returns the calculated anchor
	 */
	buildAnchor(formula) {
		let title = `<span style='background:yellow; color: brown;'>${formula}</span>`;
		return `<a style="text-align:left;" href="#" class="s easyui-tooltip" title="${title}" latex="${formula}">$${formula}$</a>`;
	}

	/**
	 * Compares 2 items of the datagrid for sorting.
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
	 * Initialises a Data Grid given by the selector
	 */
	async initialiseDatagrid(selector) {
		let inst = this;
		let filterPrompt = inst.localizer.getLocalText('FILTER_PROMPT');
		$(selector)
		.datagrid({
			//singleSelect: true,
			selectOnCheck: true,
			remoteSort: false,
			remoteFilter: false,
			pagination: true,
			pageSize: 20,
			rownumbers: true,
			fit: true,
			noheader: false,
			onAfterEdit: async function(idx, row, changes) {
				console.debug(`onAfterEdit for ${selector}`);
				inst.onAfterRender();
				return true;
			},
			onCancelEdit: async function(idx, row) {
				console.debug(`onCancelEdit for ${selector}`);
				inst.onAfterRender();
				return true;
			},
			clickToEdit: false,
			dblclickToEdit: true,
			columns: [[
				{ field: 'id', title: 'Id', hidden: true },
				{ field: 'check', checkbox: true },
				{ field: 'title', title: '<span class="custom-equations" locate="TITLE">Title</span>', width: '35%', editor: 'text', sortable: true, sorter: inst.alphaSorter.bind(inst) },
				{ field:'formula', title: '<span class="custom-equations" locate="FORMULA">Formula</span>', width:'60%' }
			]],
			idField: 'id',
			onBeforeSortColumn: function(sort, order) {
				console.debug(`Sort order is: ${order}`);
				inst.sortOrderAsc = order;
				return true;
			},
			onLoadSuccess: function() {
				$(this).datagrid('enableDnd');
				let opts = $(this).datagrid('options');
				let trs = opts.finder.getTr(this, 0, 'allbody');
				trs.draggable({
					revert: true,
					deltaX: 70,
					deltaY: 70,
					proxy: function(source) {
						console.dir(source);
						let p = $('<div class="datagrid-div tree-node-proxy droppable" style="border: 2px solid red; z-index: 100;"></div>').appendTo(`#${inst.id}`);
						let row = $('<div style="width: 400px; display: flex; flex-direction: row; justify-content: center;"></div>');
						$(source).find('td')
						.first()
						.each(function() {
							let td = $('<div style="margin: auto; width: 80px;"></div>');
							$(td).html($(this).html());
							$(td).appendTo($(row));
						});
							
						let withIcon = $(row).prepend('<div class="tree-dnd-icon tree-dnd-no" style="width: 20px;">&nbsp;</div');
						p.append($(withIcon));
						// THIS TRIAL TO MIMICK THE TREE NODE DOES NOT WORK
						// p.append('<span class="tree-indent"></span><span class="tree-file" style="width: 20px;">&nbsp;</span><span class="title">TEXT SAMPLE</span>');
						let proxy = p[0];
						console.dir(proxy);
						return p;
					}
				});
			},
			onDragOver: function(target, source) {
				console.dir(source);
			}
		});
		inst.equipDatagridWithInteractivity();
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
	}
	
	/**
	 * Returns an object with view property, assigning overrides for render methods.
	 */
	async viewRender() {
		let inst = this;
		return {
			view: $.extend(true, {}, $.fn.datagrid.defaults.view, {
				render: async function(target, container, frozen){
					$.fn.datagrid.defaults.view.render.call(this, target, container, frozen);
				},
				onBeforeRender: async function(target){
					$.fn.datagrid.defaults.view.onBeforeRender.call(this, target);
				},
				onAfterRender: function(target){
					$.fn.datagrid.defaults.view.onAfterRender.call(this, target);
					inst.onAfterRender(false);
				}
			})
		};
	}

	/**
	 * Equips the data grid anchors with interactivity. 
	 * 
	 * This is necessary because original event handlers
	 * do not stay active after changes.
	 */
	equipDatagridWithInteractivity() {
		let inst = this;
		function getSymbol(obj) { 
			if ($(obj).attr("latex") != undefined) { 
				return $(obj).attr("latex"); 
			} else { 
				return undefined; 
			} 
		}; 
		let selector = `${this.gridSelectorOfCopy}`;
		
		try {
			let grid = $(selector);
			grid
			.on('mouseover', 'a', function(event) { 
				let latex = getSymbol(event.target);
				if (latex) $("#divInformation").html(latex); 
			})
			.on('mouseout', 'a', function(event) { $("#divInformation").html("&nbsp;"); })
			.on('click', 'a', function(event) {
				event.preventDefault(); 
				let a = $(event.target);
				let latex = a.attr("latex");
				if (latex != undefined) { 
					inst.insert(latex); 
				} else { 
					$.messager.show({ 
						title: "<span class='rtl-title-withicon'>" + inst.localizer.getLocalText("INFORMATION") + "</span>", 
						msg: inst.localizer.getLocalText("NO_LATEX") 
					}); 
				}
			});
		} catch(e) {
			console.error(`Katex: equipDatagridWithInteractivity : ${e}`);
		}
	}
}

/**
 * The KIHPanels container for all Panels.
 * 
 * This hosts all Panel derived instances and is able to *show* them with a specialized method.
 * This method performs an initialisation lazily and one time and can show the Panel repeatedly.
 * Client is the central *Katex Input Helper* instance.
 */
@injectable() export class KIHPanels {
	panels = { };
	panelFactory: any;
	
	/**
	 * Constructor
	 */
	constructor(
		@inject(panelFactoryId) panelFactory: any
	) {
		this.panelFactory = panelFactory;
	}
	
	/**
	 * A generic method to instantiate Panels based on the di framework.
	 */
	async showWindowDI(wndId: any, id: string, ...params: any) {
		if (!(id in this.panels)) {
			this.panels[id] = this.panelFactory(wndId, id, this, ...params);
			await this.initialise(id, ...params);
		}
		await this.update(id, ...params);
		await this.toggle(id);
	}
	
	async initialise(id: string, initialiseSymbolContent = null) {
		await this.panels[id].initialise(initialiseSymbolContent);
	}

	async toggle(id: string) {
		await this.panels[id].toggle();
	}
	
	async update(id: string, ...params) {
		this.panels[id].update(...params);
	}
}

// This helps to import symbols in test suite
try {
	module.exports = { 
		DynamicPanel, KIHMoreDialog, KIHPanel, KIHPanels, KIHWindow
	};
} catch(e) { }
