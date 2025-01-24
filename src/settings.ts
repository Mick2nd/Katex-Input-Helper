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
			this.settings = await this.descriptions();
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
	async descriptions() : Promise<any>
	{
		var settings = {
			'data_dir':												// available for Content Scripts
			{
				section: 'KatexInputHelper.settings',
				public: false,
				value: await joplin.plugins.dataDir(),
				type: SettingItemType.String,
				description: 'The data dir for the plugin.'
			},
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

			'enclose_all_formula':
			{
				section: 'KatexInputHelper.settings',
				public: false,
				value: false,
				type: SettingItemType.Bool				
			},
			'auto_update_time':
			{
				section: 'KatexInputHelper.settings',
				public: false,
				value: 500,
				type: SettingItemType.Int				
			},
			'menu_update_type':
			{
				section: 'KatexInputHelper.settings',
				public: false,
				value: true,
				type: SettingItemType.Bool				
			},
			'auto_update_type':
			{
				section: 'KatexInputHelper.settings',
				public: false,
				value: true,
				type: SettingItemType.Bool				
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
			},
			'persist_equations_on_cancel':
			{
				section: 'KatexInputHelper.settings',
				public: false,
				label: 'Persist Equations On Cancel',
				value: true,
				type: SettingItemType.Bool
			},
			'persist_window_locations':
			{
				section: 'KatexInputHelper.settings',
				public: false,
				label: 'Persist Window Locations',
				value: true,
				type: SettingItemType.Bool
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
	
	async readSettings(parameters: any, text: string) : Promise<void> {
		parameters.equation = text;
		parameters.style = await this.style();										// the style as stored in settings
		parameters.localType = await this.localType();								// the localType
		parameters.encloseAllFormula = await this.encloseAllFormula();
		parameters.autoUpdateTime = await this.autoUpdateTime();
		parameters.autoupdateType = await this.autoUpdateType();
		parameters.menuupdateType = await this.menuUpdateType();
		
		parameters.persistEquations = await this.persistEquations();
		parameters.persistWindowPositions = await this.persistWindowPositions();
		parameters.equationCollection = await this.equationCollection();
		for (const id of this.dialogIds()) {
			const location = await this.location(id);
			parameters[id] = location;
		}		
	}
	
	async writeSettings(parameters: any, cancel: boolean = false) : Promise<void> {
		console.info(`writeSettings: ${JSON.stringify(parameters)}`);
		await this.setEquation(parameters.equation);
		await this.setStyle(parameters.style);
		await this.setLocalType(parameters.localType);
		await this.setEncloseAllFormula(parameters.encloseAllFormula);
		await this.setAutoUpdateTime(parameters.autoUpdateTime);
		await this.setAutoUpdateType(parameters.autoupdateType);
		await this.setMenuUpdateType(parameters.menuupdateType);

		await this.setPersistEquations(parameters.persistEquations);
		await this.setPersistWindowPositions(parameters.persistWindowPositions);
				
		if (parameters.persistEquations || !cancel) {
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

	async encloseAllFormula() : Promise<Boolean>
	{
		return await joplin.settings.value('enclose_all_formula');
	}
	
	async setEncloseAllFormula(enclose: Boolean) : Promise<void> {
		await joplin.settings.setValue('enclose_all_formula', enclose);
	}
	
	async autoUpdateTime() : Promise<Number>
	{
		return await joplin.settings.value('auto_update_time');
	}
	
	async setAutoUpdateTime(time: Number) : Promise<void> {
		await joplin.settings.setValue('auto_update_time', time);
	}

	async menuUpdateType() : Promise<Boolean>
	{
		return await joplin.settings.value('menu_update_type');
	}
	
	async setMenuUpdateType(type: Boolean) : Promise<void> {
		await joplin.settings.setValue('menu_update_type', type);
	}
	

	async autoUpdateType() : Promise<Boolean>
	{
		return await joplin.settings.value('auto_update_type');
	}
	
	async setAutoUpdateType(type: Boolean) : Promise<void> {
		await joplin.settings.setValue('auto_update_type', type);
	}
	
	
	async equation() : Promise<string> {
		return await joplin.settings.value('equation');
	}
	
	async setEquation(equation: string) : Promise<void> {
		await joplin.settings.setValue('equation', equation);
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
