import { inject, injectable } from 'inversify';
import { IMath, mathId, ICodeMirror } from '../src/assets/js/interfaces';
import { ISupplement } from '../tests/interfaces';

export class Supplement implements ISupplement {
	math: IMath;
	codeMirrorEditor: ICodeMirror;
	
	constructor(
		@inject(mathId) math: IMath
	) {
		this.math = math;
		this.codeMirrorEditor = math.codeMirror;
		this.initialiseSymbolContent();
	}

	/**
	 * The routine equips the entries in the given panel with functionality.
	 * 
	 * This is:
	 * - tool tip
	 * - info line
	 * - click event
	 */
	initialiseSymbolContent() { 
		let vme = this; 
		/**
		 * Given an anchor object, determines and returns the included
		 * LATEX code used as info for tool tip and info line.
		 */
		function getSymbol(a: any) {
			let info: any = beginEndInfo(a);
			if (info !== null) return info[0] + info[1];
			info = latex(a);
			if (info !== null) return info;
			return ""; 
		};
		
		/**
		 * Returns the begin to end info of an anchor.
		 */
		function beginEndInfo(a: any) {
			if (typeof ($(a).attr("lbegin")) != "undefined" && typeof ($(a).attr("lend")) != "undefined") 
				return [$(a).attr("lbegin"), $(a).attr("lend")];
			return null; 
		};
		
		/**
		 * Returns the latex info of an anchor.
		 */
		function latex(a: any) {
			if (typeof ($(a).attr("latex")) != "undefined")
				return $(a).attr("latex");
			return null;
		};
		
		$(`a.s`)
		.each(function() {
			let tt = getSymbol(this);
			vme.math.equipWithTooltip($(this), tt, true);
		});
		$('#test-container').on('click', `a.s`, function(event) {
			event.preventDefault(); 
			let info: any = beginEndInfo(this);
			if (info !== null) {
				const [ a, b ] = info;
				vme.tag(a, b);
				return;
			}
			info = latex(this);
			if (info !== null) {
				vme.insert(info);
			}
		}); 
	}


	/**
	 * Wrapper of the appropriate Math routine. Inserts a piece of 
	 * math code into the editor and updates the output.
	 */	
	insert(b: string) {
		this.math.insert(b);
		this.codeMirrorEditor.focus();
	}

	/**
	 * Insertion code for formulae with placeholder.
	 */
	tag(b: any, a: any) {
		b = b || null; 
		a = a || b; 
		if (!b || !a) { return }
		this.codeMirrorEditor.replaceSelection(b + this.codeMirrorEditor.getSelection() + a); 
		let pos = this.codeMirrorEditor.getCursor(); 
		pos.ch = pos.ch - a.length; 
		this.codeMirrorEditor.setCursor(pos); 
		this.math.updateOutput(); 
		this.codeMirrorEditor.focus();
	}

}
