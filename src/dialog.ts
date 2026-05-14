import joplin from 'api';
import { DialogResult, ButtonSpec } from 'api/types';
import { settings, Settings } from './settings';

/**
 * @abstract Sleep function using Promise contract.
 */
function Sleep(milliseconds: number) {
	return new Promise(resolve => setTimeout(resolve, milliseconds));
}

let handle: any = null;

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
 * 
 * THE ULTIMATE SOLUTION: using WEBPACK
 */	
export class Dialog
{
	id = 'Katex Input Helper Dialog';
	settings: Settings;
	displayMode: boolean;
	useEasyLoader = false;
	installationDir = "";
	isMobile: boolean = false;
	
	/**
	 * @abstract Constructor
	 */
	public constructor(displayMode: boolean)
	{
		this.displayMode = displayMode;
		this.settings = settings;
	}
	
	/**
	 * @abstract Creates the dialog and installs a message handler for handling messages sent back by
	 * 			 the dialog.
	 * 
	 * Those messages are sent back as soon as the dialog is online and are meant to query for configuration 
	 * data.
	 */
	public create = async function() : Promise<any> {
		
		handle ??= await joplin.views.dialogs.create(this.id);

		this.installationDir = await joplin.plugins.installationDir();
		this.isMobile = ((await joplin.versionInfo()).platform == 'mobile') !== (await this.settings.enforceMobileMode());
		
		await this.loadCss(handle);
		await this.loadJs(handle);

		let inst = this;
		await joplin.views.panels.onMessage(handle, async function(msg: { id: string, cmd: string, data: any }) {
			
			console.info(`Message from Webview: ${JSON.stringify(msg)}, setting dm to ${inst.displayMode} `);
			let text = await joplin.commands.execute('selectedText') as string;			// the text of the selection
			
			if (msg.id == 'Katex Input Helper') { 
				if (msg.cmd == 'getparams' || msg.cmd == 'READ') {
					
					const keys = new Set(msg.data);
					const clientKeys = new Set([ 'equation', 'displayMode', 'isMobile' ]);
					const legacyKeys = keys.difference(clientKeys);
					
					const reponse: any = { };
					await inst.settings.readSettings(reponse, [ ...legacyKeys ]);
					if (keys.has('equation')) { reponse.equation = text; }
					if (keys.has('displayMode')) { reponse.displayMode = inst.displayMode; }
					if (keys.has('isMobile')) { reponse.isMobile = inst.isMobile; }			// the Plugin has its own copy
					
					return reponse;
					
				} else if (msg.cmd == 'CREATE') {
					
					await inst.settings.create(msg.data);
					return true;
					
				} else if (msg.cmd == 'WRITE') {
					
					await inst.settings.write(...msg.data);
					return true;
				}
			}
			return false;
		});

		const ok = { id: 'okay', title: 'Okay' };
		const cancel = { id: 'mycancel', title: 'Cancel' };
		await joplin.views.dialogs.setButtons(handle, [ok, cancel]);
		await joplin.views.dialogs.setFitToContent(handle, false);				// was false!
		await joplin.views.dialogs.setHtml(handle, this.load());
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
			// handle = null;
			return res;
		}
		console.debug(`Returned KATEX form : ${JSON.stringify(res.formData.KATEX)}`);	// More than one input field could have been returned
		const json = res.formData.KATEX.hidden;
		if (!json) {
			console.warn(`No formData returned on ${res.id}`);
			return res;
		}
		const parameters = JSON.parse(json);
		if (res.id == 'okay') {
			await joplin.commands.execute(										// okay button -> save equation
				'editor.execCommand', 
				{
					name: 'replaceSelection',
					args: [ parameters.equation ?? "" ]
				});
		}
		// await this.settings.writeSettings(parameters, res.id != 'okay');		// save settings according to policy
		
		return res;
	}
	
	/**
	 * @abstract Used to load the HTML for the dialog. Does this on behalf of WEBPACK.
	 * 			 That's why the file name is hard coded.
	 * 
	 * @returns the HTML document
	 */
	public load = function() : string
	{
		try {
			return require('./assets/start.html').default;
			
		} catch(e) {

			console.warn(`Could not fetch HTML dialog : ${e}`);
		}
		return "";
	}
	
	/**
	 * @abstract Loads all required CSS files merely annoucing them to the dialog.
	 * 
	 * @param handle - the dialog handle
	 */
	public loadCss = async function(handle: any) : Promise<void> {
		
		// Probably not needed as this causes a FOUC : [ "./assets/main.css" ];
		// let css = [  ]; 
		let css = [ "./assets/css/initial.styles.css" ]; 
		
		for (const cssPath of css) {
			await joplin.views.dialogs.addScript(handle, cssPath);
		}
	}
	
	/**
	 * @abstract Loads all required Js files merely annoucing them to the dialog.
	 * 
	 * @param handle - the dialog handle
	 */
	public loadJs = async function(handle: any) : Promise<void> {
		//let js = [ "./assets/libs.js", "./assets/main.js" ];
		let js = [ "./assets/main.js" ];
		
		for (const jsPath of js) {
			await joplin.views.dialogs.addScript(handle, jsPath);
		}
	}
}
