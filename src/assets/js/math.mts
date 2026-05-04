// Reserved.
//import './jquery-easyui/jquery.easyui.min.js';						// ? ADDED for unit test ?

import { inject, injectable, Factory } from 'inversify';
import { IMath, localizerId, ILocalizer, parametersId, parserId, IParser, 
	codeMirrorFactoryId, ICodeMirror, messagerId, IMessager,
	hintsId, IHints } from './interfaces.mjs';

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
	codeMirrorFactory: Factory<ICodeMirror> = null;
	parameters = null;
	parser = null;
	dynamicPanels = [];
	messager = null;
	katex = null;
	hints: IHints = null;
	
	/**
	 * Constructor.
	 */
	constructor(
		@inject(localizerId) localizer: ILocalizer|null, 
		@inject(parametersId) parameters: any, 
		@inject(parserId) parser: IParser|null,
		@inject(messagerId) messager: IMessager|null,
		@inject(codeMirrorFactoryId) codeMirrorFactory: Factory<ICodeMirror>,
		@inject(hintsId) hints: IHints
	) {
		this.localizer = localizer;
		this.parameters = parameters;
		this.parser = parser;
		this.messager = messager;
		this.codeMirrorFactory = codeMirrorFactory;
		this.hints = hints;
	}
	
	/**
	 * Used for postponed injection. Used also for other task: loading katex.
	 */
	async injectCodeMirror() : Promise<void> {
		this.codeMirror = await this.codeMirrorFactory(this.parameters.isMobile);
		this.mathVisualOutput = $('#mathVisualOutput div')[0];
		this.katex = await import('katex/dist/katex.mjs');	// This version of import is essential for mhchem
		await import('katex/dist/contrib/mhchem.mjs');
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
			target ??= this.mathVisualOutput;
			
			text = text.replace(/&lt;/gs, '<');
			text = text.replace(/&gt;/gs, '>'); 
			text = text.replace(/&amp;/gs, '&');
			
			if (text.startsWith('$')) {
				if (! multiple) {
					text = text.substring(1, text.length - 1);
				} else {
					text = text.replace(/&nbsp;&nbsp;/gs, String.raw`\quad`);
					text = text.replace(/\$/gs, '');
				}
			}
			
			this.katex.render(text, target, { throwOnError: true, strict: false, displayMode: displayMode, macros: { '\\box': '□' } });
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
	async updateTables(panelId: string) {
		try {
			let inst = this;
			let selector = `#${panelId} a.s`;
			let entries = $(selector);
			entries.each(function(idx: number, a) {
				
				if (a && $(this).find('.katex').length == 0) {								// check : no katex embedded
					inst.updateTableAnchor(a);
				}
			});

			// TODO: TEST: changes must be updated so that easyui knows them
			await this.parser.parseAsync(selector);

		} catch(e) {
			console.error(`Katex: updateTables : %s`, e);
		}
	}

	/**
	 * Updates a single anchor in a table (panel or dialog).
	 */	
	updateTableAnchor(a: any) {
		let inst = this;
		try {
			let html = a.innerHTML;														// TODO: what was the reason for this?
			let count = html.split('$').length - 1;
			let text = a.innerText ?? a.innerHTML;										// poor implementation of vitest
			let dm = (/^\n?\$\$/.test(text) || text.includes('{equation}'));			// $$ triggers display mode
			if (count == 2 || 
				text == String.raw`$\$$` || 
				text.includes(String.raw`\ce`)) {										// normal case: math
				text = text.replace(/□/gs, String.raw`\square`);
				inst.insertMath(text, a);
				
			} else if (count > 2 && !dm) {												// image with surrounding characters
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
	 * If a selector is given, it is assumed that it is a single panel from an accordion.
	 */
	updateHeaders(selector = "") {
		try {
			let inst = this;
			let entries = $(`.panel-title span, .accordion header span`);
			if (selector.length > 0) {
				let options = $(selector).panel('options');
				let title = options.title;
				let info = $(title).attr('information');
				entries = $(`.panel-title span[information=${info}]`);				
			}
			
			entries.each((idx: number, a) => {
				if (a) {
					let text = a.innerText;
					if (text.startsWith('$')) {
						inst.insertMath(text, a, true);
					}
				}
			});
		} catch(e) {
			console.error(`Katex: updateHeaders : %s`, e);
		}
	}
	
	/**
	 * The Latex menu command gets the true Latex symbol.
	 */
	updateLatexMenu() {
		const html = this.katex.renderToString(String.raw`\LaTeX`, { displayMode: false, thrownOnError: false, output: 'html' });
		$('#mLaTeX_TEXT span, span.tree-title > span:contains("LaTeX")').html(html);
	}
	
	/**
	 * For some dialogs, which are initialized lazily, updates the Math.
	 */
	inplaceUpdate(selector: string, javascript = true) {
		try {
			const inst = this;
			const entries = $(`${selector} a.s`);
			entries.each(function(idx: number, a) {
				if (a) {
					inst.updateAnchor(a);
				}
			});
			this.hints.symbolizeTooltip(selector);
		} catch(e) {
			console.error(`Katex: inplaceUpdate : %s`, e);
		}
	}

	/**
	 * Updates an anchor (or other tag) with a formula. Takes the text from original anchor content.
	 * 
	 * @param a - An anchor or other html element serving as source and target of the operation
	 */	
	updateAnchor(a: any) {
		let text = a.innerText ?? a.innerHTML;									// poor implementation of vitest / jsdom
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
		content = content.replace(/</gsi, "&lt;"); 
		content = encloseChar + content + encloseChar; 
		
		let dm = this.enforceDm(content);
		dm = dm || vme.parameters.displayMode;						// displayMode from invocation context enforces dm
		vme.insertMath(content, null, false, dm); 
		vme.setFocus();
		this.parameters.equation = this.codeMirror.getValue();
	}
	
	/**
	 * Sets the Focus to the Code Mirror Editor. Parameter OBSOLETE?
	 */
	setFocus(disableKeyboard: boolean = false) { 
		this.codeMirror.focus(disableKeyboard);
		this.codeMirror.refresh();					// TODO: did not help to display inserted text
	}
	
	/**
	 * Determines if Display mode shall be enforced for given text.
	 * 
	 * @param text - Given text to be checked
	 * @returns A boolean indicating a required display mode for given formula
	 */
	enforceDm(text: string) : boolean {
		let dmEnforcing = [
			String.raw`\begin{CD}`,
			'{equation}',
			'{gathered}',
			'{aligned}',
			'{alignedat}',
		];
		return dmEnforcing.some(item => text.includes(item));
	}
}

// This helps to import symbols in test suite
try {
	module.exports = { MathFormulae };
} catch(e) { }
