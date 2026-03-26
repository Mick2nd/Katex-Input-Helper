import joplin from 'api';
import { MenuItemLocation, ToolbarButtonLocation, ImportContext, FileSystemItem, ContentScriptType } from 'api/types';
import { Dialog } from './dialog';
import { TestDialog } from './testDialog';
import { MathContext } from './mathContext';
import { settings } from './settings';


const withTest = false;

/**
 *	@abstract Function or lambda to execute menu command
 */
const dialog_command = async () => 
{ 
	try
	{
		const mathContext = new MathContext();
		const dm = await mathContext.displayMode();
		let dlg = new Dialog(dm ? true : false);
		await dlg.create();
		let res = await dlg.open();
		console.dir(res);
	}
	catch(e)
	{
		console.error('Exception in command: ' + e.stack);
	}
	finally
	{
		console.info('Finally'); 
	} 
}

/**
 *	@abstract Function or lambda to execute menu command
 */
const test_command = async () => 
{ 
	try
	{
		const archive = "TEST";
		var dlg = new TestDialog(archive);
		await dlg.create();
		let res = await dlg.open();
		console.dir(res);
	}
	catch(e)
	{
		console.error('Exception in command: ' + e);
	}
	finally
	{
		console.info('Finally'); 
	} 
}


joplin.plugins.register({
	onStart: async function() {
		// eslint-disable-next-line no-console
		console.info('Hello world. Test plugin started!');
		
		const scriptId = 'pluginCommandKatexDialog';
		const scriptIdCm = 'pluginCmKatexDialog';
		const scriptIdMd = 'pluginMdKatexDialog';
		
		await settings.register();
	
		await joplin.commands.register(
			{
				name: scriptId,
				label: 'Katex Dialog',
				// fa-square-root-variable not working
				iconName: 'fa fa-calculator',
				execute: dialog_command, 
			});
	
		// Desktop only !!
		await joplin.views.menuItems.create(
			'mnuKatexImportHelper', 
			scriptId,
			MenuItemLocation.Tools,
			{ accelerator: "CmdOrCtrl+Shift+K"});
			
		await joplin.views.toolbarButtons.create(
			'tbbKatexImportHelper',
			scriptId,
			ToolbarButtonLocation.EditorToolbar
		);

		await joplin.contentScripts.register(
			ContentScriptType.CodeMirrorPlugin,
			`${scriptIdCm}`,
			'./plugins/codeMirror.js'
		);

		await joplin.commands.register({
			name: 'displayMode',
			label: 'Queries the display mode',
			execute: async () => {
				await joplin.commands.execute('editor.execCommand', {
					name: 'displayMode',
					args: [ ]
				});
			},
		});
			
		if (withTest) {

			await joplin.contentScripts.register(
				ContentScriptType.MarkdownItPlugin,
				`${scriptIdMd}`,
				'./plugins/markdownIt.js'
			);

			await joplin.contentScripts.onMessage(scriptIdMd, async function(message: any) {
				if (message  !== 'queryCursorLocation')
					return;
				
				return 'test';
			});

			const scriptIdTest = 'pluginCommandKatexTestDialog';
			await joplin.commands.register(
				{
					name: scriptIdTest,
					label: 'Katex Test Dialog',
					execute: test_command, 
				});

			await joplin.views.menuItems.create(
				'mnuKatexTest', 
				scriptIdTest,
				MenuItemLocation.Tools,
				{ accelerator: "CmdOrCtrl+Shift+L"}); 
			}
		}
});
