import './jquery-easyui/jquery.easyui.min';						// ADDED for unit test
const katex = await import('katex/dist/katex');					// This version of import is essential for mhchem
await import('katex/dist/contrib/mhchem');

import { inject, injectable } from 'inversify';
import { IMath, localizerId, ILocalizer, parametersId, parserId, IParser, 
	codeMirrorId, ICodeMirror, messagerId, IMessager } from './interfaces';

/**
 * Class responsible for Math Formula handling.
 * The framework supported here is Katex.
 * CodeMirror is the only supported Editor case.
 */
@injectable()
export class MathFormulae implements IMath {
	
	mathVisualOutput = null;
	encloseAllFormula = false; 
	menuupdateType = true;
	localizer = null;
	codeMirror: ICodeMirror = null;					// per method injection
	parameters = null;
	parser = null;
	dynamicPanels = [];
	messager = null;
	
	/**
	 * Constructor.
	 */
	constructor(
		@inject(localizerId) localizer: ILocalizer|null, 
		@inject(parametersId) parameters: any|null, 
		@inject(parserId) parser: IParser|null,
		@inject(messagerId) messager: IMessager|null,
		@inject(codeMirrorId) codeMirror: ICodeMirror|null
	) {
		this.mathVisualOutput = $('#mathVisualOutput')[0];
		this.localizer = localizer;
		this.parameters = parameters;
		this.parser = parser;
		this.messager = messager;
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
	insertMath(text: string, element = null, multiple = false, displayMode = false) {
		if (text == '') {
			console.warn(`Katex: no text`);
			return;
		}
		try {
			let target = element;
			if (target == null) {
				console.debug(`Attention : writing to output area : ${displayMode}`);
				target = this.mathVisualOutput;
			}
			
			text = text.replace(/&lt;/g, '<');							// TODO: this block moved outside if block, observe!
			text = text.replace(/&gt;/g, '>'); 
			text = text.replace(/&amp;/g, '&');
			
			if (text.startsWith('$')) {
				if (! multiple) {
					text = text.substring(1, text.length - 1);
				} else {
					text = text.replace(/&nbsp;&nbsp;/g, '\\quad');
					text = text.replace(/\$/g, '');
				}
			}
			
			katex.render(text, target, { throwOnError: true, strict: false, displayMode: displayMode, macros: { '\\box': '□' } });
		} catch(e) {
			console.warn(`Katex: insertMath : ${e}`);
			this.messager.show('KATEX', 'KATEX_NOT_RENDERED', e)
		}
	}
	
	/**
	 * Updates Tables in Panels or Dialogs by translating contained Math. Although this is a Math
	 * method, it also updates some image references. TODO: implement SRP (single responsibility 
	 * principle)
	 */
	async updateTables() {
		try {
			let inst = this;
			let selector = '.panel-body table tbody tr td a.easyui-tooltip, .easyui-dialog div a.s';
			let entries = $(selector);
			console.debug(`Katex: ${entries.length} td or div items`);
			entries.each(function(idx: number, a) {
				
				if (a && $(this).find('.katex').length == 0) {								// check : no katex embedded
					inst.updateTableAnchor(a);
				}
			})

			// TODO: TEST: changes must be updated so that easyui knows them
			await this.parser.parseAsync(selector);

		} catch(e) {
			console.error(`Katex: updateTables : ${e}`);
		}
	}

	/**
	 * Updates a single anchor in a table (panel or dialog).
	 */	
	updateTableAnchor(a: any) {
		let inst = this;
		try {
			let html = a.innerHTML;												// TODO: what was the reason for this?
			let count = html.split('$').length - 1;
			let text = a.innerText ?? a.innerHTML;								// poor implementation of vitest
			let dm = (/^\n?\$\$/.test(text) || text.includes('{equation}'));	// $$ triggers display mode
			if (count == 2 || text == '$\\$$' || text.includes('\\ce')) {		// normal case: math
				text = text.replace(/□/g, '\\square');
				inst.insertMath(text, a);
			} else if (count > 2 && !dm) {										// image with surrounding characters
				let text1 = a.firstChild.textContent;
				text1 = text1.substring(1, text1.length - 1);

				let text2 = a.lastChild.textContent;
				text2 = text2.substring(1, text2.length - 1);

				let img = a.children[0];
				
				inst.insertMath(text2, a);
				let ch = a.children[0];
				inst.insertMath(text1, a);
				a.appendChild(img);
				a.appendChild(ch);
			} else if (dm) {
				inst.updateAnchor(a);
			} else {															// direct image case
				let img = a.firstChild as Element;
				if (img && img.nodeType != Node.TEXT_NODE && img.hasAttribute('src')) {
					// TODO: handling required?
				}
			}
		} catch(e) {
			console.warn(`Katex: updateTables : ${a.innerText ?? a.innerHTML} : ${e}`);
		}
	}
	
	/**
	 * Updates the headers of some Panels by translating contained Math.
	 * 
	 * If a selector is given, it is assumed that it is a single panel from an accordion.
	 */
	updateHeaders(selector = "") {
		try {
			let inst = this;
			let entries = $(`.panel-title span`);
			if (selector != '') {
				let options = $(selector).panel('options');
				let title = options.title;
				let info = $(title).attr('information');
				console.debug(`Katex: opening ${info} panel`);
				entries = $(`.panel-title span[information=${info}]`);				
			}
			
			console.debug(`Katex: ${entries.length} header items`);
			entries.each((idx: number, a) => {
				if (a) {
					let text = a.innerText;
					if (text.startsWith('$')) {
						inst.insertMath(text, a, true);
					}
				}
			});
		} catch(e) {
			console.error(`Katex: updateHeaders : ${e}`);
		}
	}
	
	/**
	 * The Latex menu command gets the true Latex symbol.
	 * 
	 * No longer working. Use workaround.
	 */
	updateLatexMenu() {
		// THIS code runs in the Browser, but not as plug-in.
		//let html = katex.renderToString('\\LaTeX', { thrownOnError: false });
		//$('#mLaTeX_TEXT span').html(html);
		
		$('#mLaTeX_TEXT span').text('LaTeX');
	}
	
	/**
	 * For some dialogs, which are initialized lazily, updates the Math.
	 */
	inplaceUpdate(selector: string, javascript = true) {
		try {
			let inst = this;
			let entries = $(selector);
			console.debug(`Katex: ${entries.length} in-place items for selector ${selector}`);
			entries.each(function(idx: number, a) {
				if (a) {
					inst.updateAnchor(a);
					if (typeof selector !== 'string' || !selector.startsWith('#mLaTeX_TEXT')) {
						inst.equipWithInteractivity($(this), javascript);					// the latex menu command will not get tooltip...
					}
				}
			});
		} catch(e) {
			console.error(`Katex: inplaceUpdate : ${e}`);
		}
	}
	
	/**
	 * Equips some anchors with interactivity which they do not already have.
	 * 
	 * "Equips" means *tooltip* and *click* and *mouseover*.
	 * If the anchor does not have a latex attribute, it will not be equipped
	 * 
	 * @param a - the anchor to be equipped
	 */
	equipWithInteractivity(a: any, javascript = true) {
		let vme = this;
		function getSymbol(obj: any) { 
			if (typeof ($(obj).attr("latex")) != "undefined") { 
				return $(obj).attr("latex"); 
			} else { 
				return vme.localizer.getLocalText("NO_LATEX"); 
			} 
		};

		if (typeof ($(a).attr("latex")) == "undefined") {
			return;
		}
		
		let text = getSymbol(a);
		this.equipWithTooltip(a, text, javascript);
		
		$(a).on('click', function(event: any) {								// TODO: seems to be functionless
			event.preventDefault(); 
			let latex = $(a).attr("latex");
			console.info(`Click on equation: ${latex}`);
			if (latex != undefined) { 
				vme.insert(latex); 
			} else {
				vme.messager.show('INFORMATION', 'NO_LATEX'); 
			} 
		}); 
	}
	
	/**
	 * Equips a selector (preferibly an anchor) with a tooltip.
	 * 
	 * Additionally prepares the same info for the status line.
	 * This is the central place for doing that.
	 * 
	 * @param selector - ui item to be equipped, must be a jquery object
	 * @param text - the tooltip text 
	 * @param javascript - how to equip. if true, javascript is used.
	 */
	equipWithTooltip(selector: any, text: string, javascript: boolean) {

		selector.addClass("easyui-tooltip s");

		let encoded = text.replace(/</g, '&lt;');									// GUI does not like text looking like tag begin -> encode
		if (javascript) {
			selector.attr("href", "javascript:void(0)");
			selector.tooltip({ 
				content: encoded,
				show: function() {
					$(this).tooltip('tip').css({ maxWidth: 500 });
				} 
			});
		} else {
			selector.attr("href", "#")
			.attr("title", function(index: number, attr: string) { return encoded; });
		}		

		selector.on('mouseover', function(event: any) { $("#divInformation").html(encoded); });
		selector.mouseout(function(event: any) { $("#divInformation").html("&nbsp;"); });
		
		return selector;
	}

	/**
	 * Updates an anchor (or other tag) with a formula. Takes the text from original anchor content.
	 * 
	 * @param a - An anchor or other html element serving as source and target of the operation
	 */	
	updateAnchor(a: any) {
		let text = a.innerText ?? a.innerHTML;									// poor implementation of vitest / jsdom
		if (text.includes('Rightarrow')) {
			console.debug(`Found-arrow-text: ${text}`);
		}
		let mathText = text.includes('$');
		let dm = text.includes('$$') || this.enforceDm(text);
		text = text.replace(/^\s{0,5}"?\${1,2}(.*?)\${1,2}"?\s{0,5}$/s, '$1');	// what does this mean?
		if (mathText) this.insertMath(text, a, false, dm);
	}
	
	/**
	 * Inserts given text into Code Mirror Editor and updates the formula in the output.
	 * 
	 * @param b - replacement for the selection in editor
	 */
	insert(b: string) {
		this.codeMirror.replaceSelection(b);
		this.updateOutput();
	}

	/**
	 * Updates the formula in the output field. Also writes the formula back to the parameters
	 * so to be returned by the dialog to its caller.
	 */	
	updateOutput() {
		let vme = this; 
		let encloseChar = "$"; 
		let content = this.codeMirror.getValue(); 
		if (content == "") content = " "; 
		content = content.replace(/</gi, "&lt;"); 
		content = encloseChar + content + encloseChar; 
		
		let dm = this.enforceDm(content);
		dm = dm || vme.parameters.displayMode;						// displayMode from invocation context enforces dm
		vme.insertMath(content, null, false, dm); 
		vme.setFocus();
		this.parameters.equation = this.codeMirror.getValue();
	}
	
	/**
	 * Sets the Focus to the Code Mirror Editor.
	 */
	setFocus() { 
		this.codeMirror.focus(); 
	}
	
	/**
	 * Determines if Display mode shall be enforced for given text.
	 * 
	 * @param text - Given text to be checked
	 * @returns A boolean indicating a required display mode for given formula
	 */
	enforceDm(text: string) : boolean {
		let dmEnforcing = [
			'\\begin{CD}',
			'{equation}',
			'{gathered}',
			'{aligned}',
			'{alignedat}',
		];
		return dmEnforcing.some(item => text.includes(item));			// TODO: includes?
	}
}

// This helps to import symbols in test suite
try {
	module.exports = { MathFormulae };
} catch(e) { }
