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
			"./tests/testDialog.css"
		];
		
		for (const path of css) {
			await joplin.views.dialogs.addScript(handle, path);
		}
	}
	
	public loadJs = async function(handle) : Promise<void> {
		var js = [
			"./assets/js/jquery-easyui/easyloader.js",
			"./tests/starter.js"
		];
		
		for (const path of js) {
			await joplin.views.dialogs.addScript(handle, path);
		}
	}
}
