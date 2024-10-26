import joplin from 'api';
import { DialogResult, ButtonSpec } from 'api/types';
import { Settings } from './settings';

const fs = require('fs-extra');
const os = require('os');
const path = require('path');


var handle: any = null;

/**
	@abstract Encapsulates dialog functionality
 */	
export class TestDialog
{
	id = 'Katex Test Dialog';
	archive: string;
	
	/**
		@abstract Constructor
	 */
	public constructor(archive: string)
	{
		this.archive = archive;
	}
	
	/**
		@abstract Creates the dialog
	 */
	public create = async function() : Promise<any>
	{
		if (handle == null)
			handle = await joplin.views.dialogs.create(this.id);

		var inst = this;
		await joplin.views.panels.onMessage(handle, async function(msg: any) {
			console.info(`Message from Webview: ${JSON.stringify(msg)}`);
			var text = await joplin.commands.execute('selectedText') as string;					// the text of the selection
			if (msg.id == 'Katex Test Dialog' && msg.cmd == 'getparams') {
				msg.equation = text;
				return msg;
			}
			return false;
		});

		const ok = { id: 'okay', title: 'Okay' };
		const cancel = { id: 'cancel', title: 'Cancel' };
		await joplin.views.dialogs.setButtons(handle, [ok, cancel]);
		await joplin.views.dialogs.setFitToContent(handle, false);
		await this.loadCss(handle);
		await this.loadJs(handle);
		await joplin.views.dialogs.setHtml(handle, await this.load('./tests/testDialog.html'));
	}
	
	public open = async function() : Promise<DialogResult>
	{
		let res = await joplin.views.dialogs.open(handle);
		return res;
	}
	
	public load = async function(fileName: string) : Promise<string>
	{
		let location = await joplin.plugins.installationDir();
		let html = await fs.readFile(path.join(location, fileName), 'utf-8');
		return html.replace("${INSTALLDIR}", location);
	}
	
	public loadCss = async function(handle) : Promise<void> {
		var css = [
			/*
				Ergebnis der Versuche soweit:
				- alles nachladen funktioniert nicht so gut
				- mit diesem Stand erst mal weiter arbeiten
			*/
			/*
			"./assets/js/jquery-easyui/themes/default/easyui.css",
			"./assets/js/jquery-easyui/themes/icon.css",
			"./assets/js/jquery-easyui-MathEditorExtend/themes/aguas/easyui.css",
			"./assets/js/jquery-easyui-MathEditorExtend/themes/icon.css",
			"./assets/js/jquery-colorpicker/css/colorpicker.css",
			"./assets/js/codemirror/lib/codemirror.css",
			"./assets/js/keyboard/Keyboard.css",
			"./assets/js/katex/katex.min.css",
			"./assets/js/dialog.css"
			"./tests/testDialog.css"
			*/
			
			// NOT loading from HTML file
			"./tests/testDialog.css"
		];
		
		for (const path of css) {
			await joplin.views.dialogs.addScript(handle, path);
		}
	}
	
	public loadJs = async function(handle) : Promise<void> {
		var js = [
			"./assets/js/jquery-easyui/jquery.min.js",
			"./assets/js/jquery-easyui/jquery.easyui.min.js",
			"./tests/testDialog.js",
			"./tests/starter.js"
			/*
			"./tests/starter.js"
			"./assets/js/jquery-easyui/jquery.min.js",
			"./assets/js/jquery-easyui/jquery.easyui.min.js",
			"./assets/js/jquery-easyui/datagrid-cellediting.js",
			"./assets/js/jquery-easyui/datagrid-filter.js",
			"./assets/js/jquery-colorpicker/js/colorpicker.js",
			"./assets/js/codemirror/lib/codemirror.js",
			"./assets/js/katex/katex.min.js",
			"./assets/js/katex/mhchem.min.js",
			"./assets/js/patterns/observable.js",
			"./assets/js/localization.js",
			"./assets/js/themes.js",
			"./assets/js/math.js",
			"./assets/js/parserExtension.js",
			"./assets/js/parameters.js",
			"./assets/js/fileHandling.js",
			"./assets/js/helpers.js",
			"./assets/js/dialog.js"
			"./tests/testDialog.js",
			*/			
		];
		
		for (const path of js) {
			await joplin.views.dialogs.addScript(handle, path);
		}
	}
}