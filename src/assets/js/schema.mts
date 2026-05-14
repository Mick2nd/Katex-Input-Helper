
export type CommonType = boolean | number | string;

export type LayoutType = {
	left?, top?, width?, height?,
	initialLeft?, initialTop?, initialWidth?, initialHeight?,
};

export type ConfigType = CommonType | LayoutType;

export enum ConfigurationEnum {
	COMMON,
	WINDOW,
	EQUATIONS,
	UNKNOWN
}

/**
 * Wrapper and adapter for *idb* functionality.
 * Manages settings to be persisted between sessions. This contains all setting 
 * keys and defaults and type resp. store information.
 */
export class Schema {
	
	_commonStore: string = "commonStore";
	_layoutStore: string = "layoutStore";
	_customEquationsStore: string = "customEquationsStore";
	_stores: string[];

	_commonKeys: string[];
	_windowKeys: string[];
	_commonDefaults: CommonType[];
	_windowDefault: any;
	_equationsDefault: any[];
	
	/**
	 * Constructor.
	 */
	constructor() {

		this._stores = [					// order matters
			this._commonStore,
			this._layoutStore,
			this._customEquationsStore,
			
		];
		this._commonKeys = [
			"migrated",						// meta
			"style", 
			"localType", 
			"autoUpdateTime", 
			"menuupdateType",
			"autoupdateType", 
			"persistEquations",
			"persistWindowPositions"
		];
		this._commonDefaults = [
			false,
			"aguas", 
			"en_US", 
			500, 
			true,
			true, 
			true,
			true
		];
		this._windowKeys = [ 
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
			"wUNICODES_LIST",
			"wLANGUAGE_LIST",
			"wEVENT_LIST"			
		];
		this._windowDefault = {
			width: 'auto',
			height: 'auto'
		};
		this._equationsDefault = [ ];
	}
	
	get commonStore() {
		return this._commonStore;
	}

	get layoutStore() {
		return this._layoutStore;
	}

	get customEquationsStore() {
		return this._customEquationsStore;
	}
	
	/**
	 * Returns the stores array.
	 */
	get stores() : string[] { return this._stores; }

	/**
	 * Returns the commonKeys array.
	 */
	get commonKeys() : string[] { return this._commonKeys; }

	/**
	 * Sets the commonKeys array.
	 */
	set commonKeys(keys: string[]) { this._commonKeys = keys; }

	/**
	 * Returns the windowKeys array.
	 */
	get windowKeys() : string[] { return this._windowKeys; }

	/**
	 * Sets the windowKeys array.
	 */
	set windowKeys(keys: string[]) { this._windowKeys = keys; }
	
	/**
	 * Returns the equationsKeys array (only a single entry at the moment).
	 */
	get equationsKeys() : string[] { return [ 'equationCollection' ]; }

	/**
	 * Enumerates the Configuration Keys togther with their store.
	 */
	*getConfigurationKeys() : IterableIterator<[ string, string ]> {
		const inst = this;
		yield* this.commonKeys.map((key) => [ inst._commonStore, key ]) as [ string, string ][];
		yield* this.windowKeys.map((key) => [ inst._layoutStore, key ]) as [ string, string ][];
		yield* this.equationsKeys.map((key) => [ inst._customEquationsStore, key ]) as [ string, string ][];
	}

	/**
	 * Enumerates the Configuration Keys togther with their store, here as getter.
	 */
	get configurationKeys() : IterableIterator<[ string, string]> {
		return this.getConfigurationKeys();
	}
	
	/**
	 * Returns the defaults for the whole set of configuration settings.
	 */
	get defaults() : any {
		const config = { };
		for (const [ , key ] of this.configurationKeys) {
			config[key] = this.defaultOf(key);
		}
		return config;
	}

	/**
	 * If key is a common key (style, locale, etc.)
	 */
	isCommonKey(key:string) : boolean {
		return this.commonKeys.includes(key);
	}

	/**
	 * If key is a window id.
	 */
	isWindowKey(key:string) : boolean {
		return this.windowKeys.includes(key);
	}

	/**
	 * If key is an equations key.
	 */
	isEquationsKey(key: string) : boolean {
		return key === 'equationCollection';
	}

	/**
	 * Checks if a key is in general a settings name.
	 * 
	 * @param key - the key to check
	 * @returns true if it's a setting
	 */
	isConfigurationKey(key: string) : boolean {
		return (
			this.isCommonKey(key) || 
			this.isWindowKey(key) || 
			this.isEquationsKey(key));
	}

	/**
	 * The type of a settings key.
	 * 
	 * @param key - the property
	 * @returns the type from the *ConfigurationType* enum
	 */
	typeOf(key: string) : ConfigurationEnum {
		
		if (this.isCommonKey(key)) { return ConfigurationEnum.COMMON; }
		if (this.isWindowKey(key)) { return ConfigurationEnum.WINDOW; }
		if (this.isEquationsKey(key)) { return ConfigurationEnum.EQUATIONS; }
		return ConfigurationEnum.UNKNOWN;	
	}

	/**
	 * Returns the default setting of a given property or key.
	 * 
	 * @param key - the property
	 * @returns the default value to be used f.i. for creation of an entry
	 */
	defaultOf(key: string) : any {
		
		if (this.isCommonKey(key)) {
			const idx = this.commonKeys.indexOf(key);
			return this._commonDefaults[idx];
		}
		if (this.isWindowKey(key)) {
			return this._windowDefault;
		}
		if (this.isEquationsKey(key)) {
			return this._equationsDefault;
		}
		
		return undefined;
	}

	/**
	 * Returns the configuration keys for one store.
	 * 
	 * @param idx - the store index (0, 1, 2)
	 */
	keysOf(idx: number) : string[] {
		switch(idx) {
			case 0: return this.commonKeys;
			case 1: return this.windowKeys;
			case 2: return this.equationsKeys;
		}
		return [];
	}
}

