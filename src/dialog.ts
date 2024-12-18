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
export class Dialog
{
	id = 'Katex Input Helper Dialog';
	settings: Settings;
	archive: string;
	
	/**
		@abstract Constructor
	 */
	public constructor(archive: string)
	{
		this.archive = archive;
		this.settings = new Settings();
	}
	
	/**
		@abstract Creates the dialog
	 */
	public create = async function() : Promise<any>
	{
		if (handle == null)
			handle = await joplin.views.dialogs.create(this.id);

		var inst = this;
		await this.settings.register();
		await joplin.views.panels.onMessage(handle, async function(msg: any) {
			console.info(`Message from Webview: ${JSON.stringify(msg)}`);
			var text = await joplin.commands.execute('selectedText') as string;					// the text of the selection
			if (msg.id == 'Katex Input Helper' && msg.cmd == 'getparams') {
				await inst.settings.readSettings(msg, text);
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
		await joplin.views.dialogs.setHtml(handle, await this.load('./assets/dialog.html'));
	}
	
	public open = async function() : Promise<DialogResult>
	{
		let res = await joplin.views.dialogs.open(handle);
		if (res.formData == undefined) {
			console.warn(`No formData returned on ${res.id}`)
		}
		let parameters = JSON.parse(res.formData.KATEX.hidden);
		if (res.id == 'okay') {
			await joplin.commands.execute(										// okay button -> save equation
				'editor.execCommand', 
				{
					name: 'replaceSelection',
					args: [ parameters.equation ]
				});
		}
		await this.settings.writeSettings(parameters, res.id != 'okay');		// save settings according to policy
		
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
			"./assets/js/jquery-easyui/themes/default/easyui.css",
			"./assets/js/jquery-easyui/themes/icon.css",
			"./assets/js/jquery-easyui-MathEditorExtend/themes/aguas/easyui.css",
			"./assets/js/jquery-easyui-MathEditorExtend/themes/icon.css",
			// active activates right to left
			// "./assets/js/jquery-easyui-MathEditorExtend/themes/rtl.css",
			"./assets/js/jquery-colorpicker/css/colorpicker.css",
			"./assets/js/codemirror/lib/codemirror.css",
			"./assets/js/keyboard/Keyboard.css",
			"./assets/js/katex/katex.min.css",
			"./assets/js/dialog.css"
		];
		
		for (const path of css) {
			await joplin.views.dialogs.addScript(handle, path);
		}
	}
	
	public loadJs = async function(handle) : Promise<void> {
		var js = [
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
			"./assets/js/parserExtension.js",
			"./assets/js/parameters.js",
			"./assets/js/fileHandling.js",
			"./assets/js/helpers.js",
			"./assets/js/math.js",
			"./assets/js/panels.js",
			"./assets/js/dialog.js"			
		];
		
		for (const path of js) {
			await joplin.views.dialogs.addScript(handle, path);
		}
	}
}
