import './jquery-easyui/jquery.easyui.min';
const CodeMirror = (await import('codemirror')).default;
await import('codemirror/mode/stex/stex');						// manual recommendation

import { ICodeMirror } from './interfaces';

/**
 * Instantiates the Code Mirror editor. This assigns it to a textarea and provides
 * parameters.
 */
export function codeMirrorProxy() : ICodeMirror {
	const options = { 
		mode: "text/x-latex", 
		autofocus: true, 
		showCursorWhenSelecting: true, 
		lineNumbers: true, 
		lineWrapping: true,		// was: true
		tabSize: 4,
		indentUnit: 4, 
		indentWithTabs: true, 
		theme: "default",
		fixedGutter: true,			// was: not present
		
		// According doc default depends on mobile
		// inputStyle: "textarea"
	};
	// const cm = CodeMirror.fromTextArea($("#mathTextInput")[0] as HTMLTextAreaElement, options);
	const cm = CodeMirror($("#divMathTextInput")[0] as HTMLElement, options);
	
	function removeChar() {
		const endCursor = cm.getCursor();
		const startCursor = { line: endCursor.line, ch: endCursor.ch - 1 };
		cm.replaceRange('', startCursor, endCursor);
	}
	
	function activate() {
		cm.replaceSelection(' ');
		removeChar();
	}
	
	activate();					// this is a workaround for the mobile version
	((cm as any) as ICodeMirror).activateEditor = activate;
	((cm as any) as ICodeMirror).removeCharBeforeCursor = removeChar;
	((cm as any) as ICodeMirror).version = CodeMirror.version;

	return (cm as any) as ICodeMirror;
}
