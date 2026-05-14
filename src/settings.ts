import joplin from 'api';
import { SettingItemType, SettingItemSubType, SettingItem } from 'api/types';


/**
 * @abstract Supports Settings for the Calibre Import plugin.
 * 			 Attributes plugin is also supported (script side).
 */
export class Settings
{
	/**
	 * Constructor.
	 */
	constructor()
	{
		this.dialogSettingsPrefix = "KIH_Location_";
	}
	
	/**
	 * Registers a series of settings used by the Plugin
	 * Prepares for notifications of settings changes
	 */
	async register() : Promise<void>
	{
		if (!this.fullyRegistered) {
			this.mobile = (await joplin.versionInfo()).platform == 'mobile';
			await joplin.settings.registerSection(this.sectionName(), this.sectionLabel());
			
			await joplin.settings.registerSettings(await this.durableSettings());
			await joplin.settings.onChange(this.onChange.bind(this));
			
			this.fullyRegistered = true;
		}
	}
	
	/**
	 * Change handler for settings changes on the Plugin side.
	 * Library Folder changes are used to update the custom columns definitions.
	 * All other changes are reported to the Markdown-it script.
	 */
	onChange(event: { keys: [string] }) : void
	{
		console.info(`onChange triggered: ${event.keys}`);
	}

	/**
	 * Returns the *durable* settings of the Plugin.
	 */	
	async durableSettings() : Promise<any> {
		const settings = {											// those are never to be deleted
			'enforce_mobile_mode':
			{
				section: 'KatexInputHelper.settings',
				public: true,
				value: false,
				type: SettingItemType.Bool,
				label: this.mobile ? 'Enforce Desktop Mode' : 'Enforce Mobile Mode',
				description: this.mobile ? 'Used to enforce desktop mode on mobile' : 'Used to enforce mobile mode on desktop'
			},
			'data_dir':												// available for Content Scripts
			{
				section: 'KatexInputHelper.settings',
				public: false,
				value: await joplin.plugins.dataDir(),
				type: SettingItemType.String,
				description: 'The data dir for the plugin.'
			},
			'migrated':												// state of migration to the indexedDB database
			{
				section: 'KatexInputHelper.settings',
				public: false,
				value: false,
				type: SettingItemType.Bool,
				description: 'The state of migration to indexedDB.'
			},
		
		};

		return settings; 
	}

	/**
	 * The prefix as used by dialog and window settings names.
	 */	
	locationPrefix() : string {
		return this.dialogSettingsPrefix;
	}

	/**
	 * Reads settings as requested by the webview.
	 */	
	async readSettings(parameters: any, keys: string[]) : Promise<void> {
		
		if (await joplin.settings.value(`migrated`)) {
			console.info(`Settings are migrated - no longer use them from Joplin`);
			return; 
		}
		
		for (const key of keys) {
			if (key.startsWith('w')) {
				parameters[key] = await this.location(key);
			} else {
				parameters[key] = await joplin.settings.value(key);
			}
		}
	}

	/*	
	async writeSettings(parameters: any, cancel: boolean = false) : Promise<void> {
		
		if (parameters.migrated) {
			await joplin.settings.setValue(`migrated`, true);
			console.info(`Settings migrated to indexedDB.`);
			return;
		}
		
		for (const [key, val] of Object.entries(parameters)) {
			switch(key) {
				case 'equation': await this.setEquation(val as string); break;
				case 'enforceMobileMode': await this.setEnforceMobileMode(val as boolean); break;
				case 'style': await this.setStyle(val as string); break;
				case 'localType': await this.setLocalType(val as string); break;
				case 'encloseAllFormula': await this.setEncloseAllFormula(val as boolean); break;
				case 'autoUpdateTime': await this.setAutoUpdateTime(val as number); break;
				case 'autoupdateType': await this.setAutoUpdateType(val as boolean); break;
				case 'menuupdateType': await this.setMenuUpdateType(val as boolean); break;
				case 'persistEquations': await this.setPersistEquations(val as boolean); break;
				case 'persistWindowPositions': await this.setPersistWindowPositions(val as boolean); break;
			
			}
		}
				
		if ((parameters.persistEquations || !cancel) && 'equationCollection' in parameters) {
			await this.setEquationCollection(parameters.equationCollection);
		}
		if (parameters.persistWindowPositions) {
			for (const id of this.dialogs) {
				if (id in parameters) {
					await this.setLocation(id, parameters[id]);
				}
			}			
		}		
	}
	*/
	
	/**
	 * Writes a single setting.
	 */
	async write(key: string, val: any) {
		
		if (key.startsWith('w')) {
			await this.setLocation(key, val);
		} else {
			await joplin.settings.setValue(key, val);
		}	
	}
	
	/**
	 * Creates a set of settings originating from the webview.
	 */
	async create(defaults: any) : Promise<void> {
		const inst = this;
		function typeOf(config: any) : SettingItemType {
			switch(typeof config) {
				case 'object': return SettingItemType.Object;
				case 'string': return SettingItemType.String;
				case 'number': return SettingItemType.Int;
				case 'boolean': return SettingItemType.Bool;
			}
			return SettingItemType.Object;
		}
		function makeSetting(key: string, config: any) : [ string, SettingItem ] {
			const name = (key.startsWith('w') ? `${inst.dialogSettingsPrefix}${key}` : key);
			const setting: [ string, SettingItem ] = [
				name, {
					'section': 'KatexInputHelper.settings',
					'label': key,
					'public': false,
					'value': config,
					'type': typeOf(config),
					'description': `Internal setting`
				}
			];
			return setting;
		}
		const entries = Object.entries(defaults).map(([ key, config ]) => makeSetting(key, config));
		const settings = Object.fromEntries(entries);
		await joplin.settings.registerSettings(settings);
	}
	
	/**
	 * PUBLIC
	 */
	async enforceMobileMode() : Promise<boolean>
	{
		return await joplin.settings.value('enforce_mobile_mode');
	}

	async setEnforceMobileMode(mode: boolean) : Promise<void> {
		await joplin.settings.setValue('enforce_mobile_mode', mode);
	}
	
	async persistEquations() : Promise<boolean> {
		return await joplin.settings.value('persist_equations_on_cancel');
	}
	
	async setPersistEquations(persist: boolean) : Promise<void> {
		await joplin.settings.setValue('persist_equations_on_cancel', persist);
	}
	
	async persistWindowPositions() : Promise<boolean> {
		return await joplin.settings.value('persist_window_locations');
	}
	
	async setPersistWindowPositions(persist: boolean) : Promise<void> {
		await joplin.settings.setValue('persist_window_locations', persist);
	}
	
	async location(id: string) : Promise<any> {
		return await joplin.settings.value(`${this.dialogSettingsPrefix}${id}`);
	}
	
	async setLocation(id: string, location: any) : Promise<void> {
		await joplin.settings.setValue(`${this.dialogSettingsPrefix}${id}`, location);
	}
	
	/**
	 * The section name to be used internally by Joplin for these settings.
	 */
	sectionName() : string
	{
		return 'KatexInputHelper.settings';
	}
	
	/**
	 * The section label name to be used by Joplin for these settings.
	 */
	sectionLabel() : any
	{
		return { label: 'Katex Input Helper' };
	}

	fullyRegistered: boolean = false;
	dialogSettingsPrefix: string;
	mobile: boolean;
}

export const settings = new Settings();
