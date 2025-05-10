import joplin from 'api';
import { DialogResult, ButtonSpec } from 'api/types';
import { Settings } from './settings';

const fs = joplin.require('fs-extra');
const path = require('path');

/**
 * @abstract Sleep function using Promise contract.
 */
function Sleep(milliseconds: number) {
	return new Promise(resolve => setTimeout(resolve, milliseconds));
}

var handle: any = null;

/**
 * @abstract Encapsulates dialog functionality.
 * 
 * Several trials have been performed to overcome the *start problem*:
 * - use require from Joplin
 * - use absolute file system paths to load css and js files
 * - use a Sleep function to defer loading
 * - change invocation order
 * 
 * Nothing did help.
 */	
export class Dialog
{
	id = 'Katex Input Helper Dialog';
	settings: Settings;
	displayMode: boolean;
	useEasyLoader = false;
	installationDir = "";
	
	/**
	 * @abstract Constructor
	 */
	public constructor(displayMode: boolean)
	{
		this.displayMode = displayMode;
		this.settings = new Settings();
	}
	
	/**
	 * @abstract Creates the dialog and installs a message handler for handling messages sent back by
	 * 			 the dialog.
	 * 
	 * Those messages are sent back as soon as the dialog is online and are meant to query for configuration 
	 * data.
	 */
	public create = async function() : Promise<any> {
		
		if (handle == null) {
			handle = await joplin.views.dialogs.create(this.id);
		}

		this.installationDir = await joplin.plugins.installationDir();
		await this.loadCss(handle);
		await this.loadJs(handle);

		var inst = this;
		await this.settings.register();
		await joplin.views.panels.onMessage(handle, async function(msg: any) {
			
			console.info(`Message from Webview: ${JSON.stringify(msg)}, setting dm to ${inst.displayMode} `);
			var text = await joplin.commands.execute('selectedText') as string;					// the text of the selection
			if (msg.id == 'Katex Input Helper' && msg.cmd == 'getparams') {
				await inst.settings.readSettings(msg, text);
				msg.equation = text;
				msg.displayMode = inst.displayMode;
				return msg;
			}

			if (msg.id == 'Katex Input Helper' && msg.cmd == 'sendparams') {
				console.debug(`Message from WebView: %O`, msg);
				return true;
			}
			return false;
		});

		const ok = { id: 'okay', title: 'Okay' };
		const cancel = { id: 'cancel', title: 'Cancel' };
		await joplin.views.dialogs.setButtons(handle, [ok, cancel]);
		await joplin.views.dialogs.setFitToContent(handle, false);								// was false!
		await joplin.views.dialogs.setHtml(handle, await this.load('./assets/dialog.html'));
	}
	
	/**
	 * @abstract Opens the dialog and waits until user return.
	 * 
	 * After return the data is evaluated and stored.
	 * 
	 * @returns the dialog result
	 */
	public open = async function() : Promise<DialogResult>
	{
		let res = await joplin.views.dialogs.open(handle);
		if (res.formData == undefined) {
			console.warn(`No formData returned on ${res.id}`);
			// TODO: joplin does not like re-creation of handles
			//handle = null;
			return res;
		}
		const json = res.formData.KATEX.hidden;
		if (!json) {
			console.warn(`No formData returned on ${res.id}`);
			return res;
		}
		console.debug(`Returned Json : ${json} `);
		let parameters = JSON.parse(json);
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
	
	/**
	 * @abstract Used to load the HTML for the dialog. Uses a file system operation.
	 * 
	 * @param fileName - the file path relative to the assets folder
	 * @returns the HTML document
	 */
	public load = async function(fileName: string) : Promise<string>
	{
		let location = path.join(this.installationDir, fileName);
		let html = await fs.readFile(location, 'utf-8');
		return html;;
	}
	
	/**
	 * @abstract Loads all required CSS files merely annoucing them to the dialog.
	 * 
	 * @param handle - the dialog handle
	 */
	public loadCss = async function(handle) : Promise<void> {
		var css = this.useEasyLoader ? [] : [
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
			// "./assets/js/jquery-colorpicker/css/colorpicker.css",
			"./assets/js/codemirror/lib/codemirror.css",
			"./assets/js/keyboard/Keyboard.css",
			"./assets/js/katex/katex.min.css",
			"./assets/js/dialog.css"
		];
		
		for (const cssPath of css) {
			await joplin.views.dialogs.addScript(handle, cssPath);
		}
	}
	
	/**
	 * @abstract Loads all required Js files merely annoucing them to the dialog.
	 * 
	 * @param handle - the dialog handle
	 */
	public loadJs = async function(handle) : Promise<void> {
		var js = this.useEasyLoader ? [
			"./assets/js/jquery-easyui/easyloader.js",
			"./assets/js/bootLoader.js"
		] : [
			// does not work
			//"./assets/js/pre-process.js",
			"./assets/js/jquery-easyui/jquery.min.js",
			"./assets/js/jquery-easyui/jquery.easyui.min.js",
			"./assets/js/jquery-easyui/datagrid-cellediting.js",
			"./assets/js/jquery-easyui/datagrid-filter.js",
			// NOT REQUIRED FOR DRAGGING DATAGRID ROW TO TREE
			"./assets/js/jquery-easyui/datagrid-dnd.js",
			// "./assets/js/jquery-colorpicker/js/colorpicker.js",
			"./assets/js/codemirror/lib/codemirror.js",
			"./assets/js/katex/katex.min.js",
			"./assets/js/katex/contrib/mhchem.min.js",
			// does not work
			//"./assets/js/di/inversifyjs.min.js",

			"./assets/js/patterns/observable.js",
			"./assets/js/localization.js",
			"./assets/js/themes.js",
			"./assets/js/parserExtension.js",
			"./assets/js/parameters.js",
			"./assets/js/fileHandling.js",
			"./assets/js/helpers.js",
			"./assets/js/math.js",
			"./assets/js/categoriesTree.js",
			"./assets/js/panels.js",
			"./assets/js/dialog.js",
			"./assets/js/bootLoader.js"
		];
		
		for (const jsPath of js) {
			await joplin.views.dialogs.addScript(handle, jsPath);
			//await Sleep(100);
		}
	}
}
