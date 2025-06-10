import './jquery-easyui/jquery.easyui.min';
const CodeMirror = (await import('codemirror')).default;
await import('codemirror/mode/stex/stex');						// manual recommendation

import { ICodeMirror } from './interfaces';

export function codeMirrorProxy() : ICodeMirror {
	const cm = CodeMirror.fromTextArea($("#mathTextInput")[0] as HTMLTextAreaElement, { 
		mode: "text/x-latex", 
		autofocus: true, 
		showCursorWhenSelecting: true, 
		lineNumbers: true, 
		lineWrapping: true, 
		tabSize: 4,
		indentUnit: 4, 
		indentWithTabs: true, 
		theme: "default",
		inputStyle: "textarea"
	});
	(cm as ICodeMirror).version = CodeMirror.version;

	// PURPOSE of this clause is to overcome the exception in unit test. Mocking did not help.
	try {
		let panelOptions = $('#divMathTextInput').panel('options');
		panelOptions.onResize = function(width: string|number, height: string|number) {
			try {
				cm.setSize(width, height);
				cm.refresh();
			} catch(e) { }
		};
	} catch(e) { console.warn(`Could not apply 'panel' : ${typeof $('#divMathTextInput').panel} : ${e}`); }

	return cm;
}
