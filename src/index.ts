import joplin from 'api';
import { MenuItemLocation, ImportContext, FileSystemItem } from 'api/types';
import { Dialog } from './dialog';


/**
	@abstract Function or lambda to execute menu command
 */
const dialog_command = async () => 
{ 
	try
	{
		const archive = "TEST";
		var dlg = new Dialog(archive);
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
	
		await joplin.commands.register(
			{
				name: scriptId,
				label: 'Katex Dialog',
				execute: dialog_command, 
			});
	
		await joplin.views.menuItems.create(
			'mnuImportQnapNotes', 
			scriptId,
			MenuItemLocation.Tools,
			{ accelerator: "CmdOrCtrl+Shift+K"}); 
			
		},
});
