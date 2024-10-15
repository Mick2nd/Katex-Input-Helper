import joplin from 'api';
import { SettingItemType, SettingItemSubType } from 'api/types';


/**
 * @abstract Supports Settings for the Calibre Import plugin.
 * 			 Attributes plugin is also supported (script side).
 */
export class Settings
{
	/**
	 * @abstract Constructor
	 */
	constructor()
	{
		this.fullyRegistered = false;
		this.dialogSettingsPrefix = "KIH_Location_";
		this.dialogs = [
			"wf_BRACKET_SYMBOLS_MORE", 
			"wf_ARROW_SYMBOLS_MORE", 
			"wf_RELATION_SYMBOLS_MORE", 
			"wf_FR_CHAR_MORE", 
			"wf_BBB_CHAR_MORE", 
			"wf_L_U_GREEK_CHAR_MORE", 
			"wf_ALL_CHAR_MORE", 
			"wf_EQUATION_MORE", 
			"wf_COMMUTATIVE_DIAGRAM_MORE", 
			"wf_CHEMICAL_FORMULAE_MORE", 
			"wf_HORIZONTAL_SPACING_MORE", 
			"wf_VERTICAL_SPACING_MORE", 
			"wf_SPECIAL_CHARACTER_MORE", 
			"wf_CUSTOM_EQUATIONS_MORE",
			
			"wEDITOR_PARAMETERS",
			"wINFORMATIONS",
			"wLANGUAGE_CHOISE",
			"wSTYLE_CHOISE",
			"wMATRIX",
			"wLATEX_CODES_LIST",
			"wASCIIMATH_CODES_LIST",
			"wUNICODES_LIST",
			"wLANGUAGE_LIST"
		];

	}
	
	/**
	 * @abstract Registers a series of settings used by the Plugin
	 * 			 Prepares for notifications of settings changes
	 */
	async register() : Promise<void>
	{
		if (!this.fullyRegistered) {
			this.settings = this.descriptions();
			await joplin.settings.registerSection(this.sectionName(), this.sectionLabel());
			await joplin.settings.registerSettings(this.settings);
		
			await joplin.settings.onChange(this.onChange.bind(this));
			
			this.fullyRegistered = true;
		}
	}
	
	/**
	 * @abstract Change handler for settings changes on the Plugin side.
	 * 			 Library Folder changes are used to update the custom columns definitions.
	 * 			 All other changes are reported to the Markdown-it script.
	 */
	onChange(event: { keys: [string] }) : void
	{
		console.info(`onChange triggered: ${event.keys}`);
		
		if (event.keys.includes('xxx'))											// handles changes of the library folder
		{
		}
		else
		{
		}
	}
	
	/**
	 * @abstract Returns the descriptions of the settings how they are needed by Joplin.
	 * 			 This is done in 2 passes:
	 * 			 - the first pass returns settings which are always required
	 * 			 - the second pass returns all other settings including custom columns
	 * 
	 * @param firstPass - true for the first pass invocation
	 * @returns			- the descriptions for the settings
	 */
	descriptions() : any
	{
		var settings = {
			'style':
			{
				section: 'KatexInputHelper.settings',
				public: false,
				label: 'Style',
				value: 'aguas',
				type: SettingItemType.String,
				description: 'The style of the plugin.'
			},
			'local_type':
			{
				section: 'KatexInputHelper.settings',
				public: false,
				label: 'Local Type',
				value: 'en_US',
				type: SettingItemType.String,
				description: 'The Local Type of the plugin.'
			},
			'equation':
			{
				section: 'KatexInputHelper.settings',
				public: false,
				label: 'Initial Equation',
				value: '\\vec{F} = \\frac{d \\vec{p}}{dt} = m \\frac{d \\vec{v}}{dt} = m \\vec{a}',
				type: SettingItemType.String,
				description: 'The Initial Equation to be displayed.'
			},
			'equation_collection':
			{
				section: 'KatexInputHelper.settings',
				public: false,
				label: 'Equation Collection',
				value: [ ],
				type: SettingItemType.Object,
				description: 'A Equation Collection to be maintained by the customer'
			}
		};
		
		return Object.assign(settings, this.locationSettings());
	}
	
	locationSettings() : any {
		let settings = { };

		for (const dialog of this.dialogs) {
			settings[`${this.dialogSettingsPrefix}${dialog}`] = {
				'section': 'KatexInputHelper.settings',
				'public': false,
				'value': null,
				'type': SettingItemType.Object,
				'description': `Location settings for ${dialog} dialog`
			}
				
		}

		return settings;
	}
	
	dialogIds() : string[] {
		return this.dialogs;
	}
	
	locationPrefix() : string {
		return this.dialogSettingsPrefix;
	}
	
	dialogSettingNames() : string[] {
		return this.dialogs.map(id => `${this.dialogSettingsPrefix}${id}`);
	}
	
	async writeSettings(parameters: any) : Promise<void> {
		console.info(`writeSettings: ${JSON.stringify(parameters)}`);
		await this.setEquation(parameters.equation);
		await this.setStyle(parameters.style);
		await this.setLocalType(parameters.localType);
		await this.setEquationCollection(parameters.equationCollection);
		
		for (const id of this.dialogs) {
			if (id in parameters) {
				await this.setLocation(id, parameters[id]);
			}
		}
	}
	
	async style() : Promise<string> {
		return await joplin.settings.value('style');
	}
	
	async setStyle(style: string) : Promise<void> {
		await joplin.settings.setValue('style', style);
	}
	
	async localType() : Promise<string> {
		var local_type = await joplin.settings.value('local_type');
		console.info(`LocalType was: ${local_type}`);
		return local_type;
	}
	
	async setLocalType(type: string) : Promise<void> {
		await joplin.settings.setValue('local_type', type);
	}
	
	async equation() : Promise<string> {
		return await joplin.settings.value('equation');
	}
	
	async setEquation(equation: string) : Promise<void> {
		await joplin.settings.setValue('equation', equation);
	}
	
	async equationCollection() : Promise<any> {
		return await joplin.settings.value('equation_collection');
	}
	
	async setEquationCollection(collection: any) : Promise<void> {
		await joplin.settings.setValue('equation_collection', collection);
	}
	
	async location(id: string) : Promise<any> {
		return await joplin.settings.value(`${this.dialogSettingsPrefix}${id}`);
	}
	
	async setLocation(id: string, location: any) : Promise<void> {
		await joplin.settings.setValue(`${this.dialogSettingsPrefix}${id}`, location);
	}
	
	/**
	 * @abstract The section name to be used internally by Joplin for these settings
	 */
	sectionName() : string
	{
		return 'KatexInputHelper.settings';
	}
	
	/**
	 * @abstract The section label name to be used by Joplin for these settings
	 */
	sectionLabel() : any
	{
		return { label: 'Katex Input Helper' };
	}

	settings: any;
	fullyRegistered: boolean;
	dialogSettingsPrefix: string;
	dialogs: string[];
}
