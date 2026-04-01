import './jquery-easyui/jquery.easyui.min';
import { basicSetup } from "codemirror";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { StreamLanguage, syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { stexMath } from "@codemirror/legacy-modes/mode/stex";
import { bbedit, darcula } from "@uiw/codemirror-themes-all";
//import { bbedit } from "@uiw/codemirror-theme-bbedit";
//import { darcula } from "@uiw/codemirror-theme-darcula";

import { ICodeMirror } from './interfaces';

/**
 * Proxy class implements the ICodeMirror interface
 */
export class CodeMirrorProxy implements ICodeMirror {
	
	/**
	 * @constructor
	 */
	constructor(isMobile: boolean) {
		
		this.isMobile = isMobile;
		this.editable = true; // !isMobile;
		this.editableCompartment = new Compartment();
		this.themeConfig = new Compartment();
		
		this.state = EditorState.create({
		  // Use the textarea's value as the initial text for CodeMirror
		  doc: "",
		  extensions: [
			basicSetup,
			keymap.of(defaultKeymap), 
			lineNumbers(),
			StreamLanguage.define(stexMath),
			EditorView.updateListener.of(update => {
				if (update.docChanged && this.eventHandler != null) {
					this.eventHandler();
				}
			}),
			this.editableCompartment.of(EditorView.editable.of(this.editable)),
			EditorView.domEventHandlers({
				'touchstart': this.touchEventHandler.bind(this),
				'touchend': this.touchEventHandler.bind(this),
				'touchmove': this.touchEventHandler.bind(this)
			})
		  ],
		});

		this.view = new EditorView({
		  state: this.state,
		  parent: $("#divMathTextInput")[0] as HTMLElement,
		});
		this.view.viewport.from = 0;
		
		this.setOption('theme', 'bbedit');
	}
	
	/**
	 * Replaces the selection in the editor with the given string.
	 * 
	 * @param b - string to be inserted
	 */
	replaceSelection(b: string) : void {
		
		this.view.dispatch(this.view.state.replaceSelection(b))	
	}
	
	/**
	 * Queries and returns the current selection.
	 * 
	 * @returns the current selection string
	 */
	getSelection() : string {
		
		const range = this.view.state.selection.ranges[0];
		return this.view.state.sliceDoc(range.from, range.to); 
	}
	
	/**
	 * Sets the content of the whole editor area.
	 * 
	 * @param val - new editor content
	 */
	setValue(val: string | ArrayBuffer) : void {
		
		this.view.dispatch({ changes: { from: 0, to: this.view.state.doc.toString().length, insert: val.toString() }});
		// TODO: change?
		this.view.viewport.to = Math.min(100, val.toString().length);
	};
	
	/**
	 * Returns the whole content of the document.
	 * 
	 * @returns the document content
	 */
	getValue() : string {
		
		return this.view.state.doc.toString(); 
	}
	
	/**
	 * Sets the focus to the editor view.
	 * TODO: Problem: we cannot avoid automatic screen keyboard pop-ups on Android
	 * -> deactivate mechanism, because it does not work
	 * 
	 * @param [disableKeyboard = false] - true switches the screen keyboard off 
	 */
	focus(disableKeyboard: boolean = false) : void { 
		
		this.view.focus();

		/*		
		if (disableKeyboard) {
			this.makeEditable(false);					// hope: this should switch the keyboard OFF
			this.makeEditable(true);
		}
		*/
	}
	
	/**
	 * Not implemented.
	 */
	refresh() : void { 
		
	}
	
	/**
	 * Returns the number of the last line (zero based)
	 * 
	 * @returns number of the last line (TODO: CHECK)
	 */
	lastLine() : number { 
		
		return this.view.state.doc.lines - 1; 
	}
	
	/**
	 * Sets the cursor.
	 * 
	 * @param cursor - cursor position in old code mirror 5 format
	 * 				   -1 is used to position on end.
	 */
	setCursor(cursor: any) : void {
		
		function posToOffset(doc, pos) {
			return doc.line(pos.line + 1).from + pos.ch;
		}
		
		const length = this.view.state.doc.toString().length;
		let offset = length;
		if (cursor != -1) {
			offset = Math.min(posToOffset(this.view.state.doc, cursor), length);	
		}
		try {
			this.view.dispatch({
				selection: {
					anchor: offset,
					head: offset
			    },
			});
		} catch(e) {
			console.warn(`ICodeMirror.setCursor at ${offset}, max : ${length} : ${e}`);
		}
	}
	
	/**
	 * Queries the cursor position.
	 * 
	 * @returns cursor position in old code mirror 5 format
	 */
	getCursor() : any {
		
		function offsetToPos(doc, offset) : any {
			let line = doc.lineAt(offset)
			return { line: line.number - 1, ch: offset - line.from };
		}
		
		return offsetToPos(this.view.state.doc, this.view.state.selection.ranges[0].to); 
	}
	
	/**
	 * Sets an option. Only 'theme' is supported.
	 */
	setOption(option: string, val: any) : void { 
		
		if (option != 'theme') {
			console.warn(`Code Mirror options not supported : ${option}`);
			return;
		}
		if (val == 'default') val = bbedit;
		if (val == 'zenburn') val = darcula;
		
		this.view.dispatch({
		   effects: this.themeConfig.reconfigure([ val ])
		 })
		
	}
	
	/**
	 * Sets a single event handler for 'change' events.
	 */
	on(_evt: string, handler: any) : void {		
		this.eventHandler = handler;
	}

	/**
	 * Replaces a range in the given document.
	 * TODO: adapt to Code Mirror 5 format (from, to)
	 * 
	 * @param replacement - replacement string
	 * @param from - begin of range
	 * @param to - end of range
	 */	
	replaceRange(replacement: string, from: any, to: any, _origin?: string) : void { 

		this.view.dispatch({ 
			changes: { from: from, to: to, insert: replacement }
		});		
	}
	
	/**
	 * Experience:
	 * The touch events do not arrive, if the Editor is set to be not editable.
	 * The mechanism is not working this way.
	 */
	touchEventHandler(event: TouchEvent) {
		
		if (event.type == "touchstart" || event.type == 'touchmove') {
			this.touchStart = Date.now();								// reset start time
		}
		if (event.type == "touchend") {
			const elapsed = Date.now() - this.touchStart;
			const threshold = this.editable ? 2000 : 1000;
			
			if (elapsed >= threshold) {									// finger pressed longer than threshold
				event.preventDefault(); 								// Verhindert Zoom

				this.editable = !this.editable;							// toggle the editable state
				this.makeEditable(this.editable);
			}
		}
	}
	
	makeEditable(editable: boolean) {
		this.view.dispatch({ 
			effects: this.editableCompartment.reconfigure(EditorView.editable.of(editable)) 
		});
	}
	
	
	isMobile: boolean = false;
	version?: string = "6.x" ;
	state: EditorState;
	view: EditorView;
	eventHandler: any = null;
	themeConfig: any = null;
	editableCompartment: any = null;
	editable:boolean = true;
	touchStart = Date.now();
}

// This helps to import symbols in test suite
try {
	module.exports = { CodeMirrorProxy };
} catch(e) { }

