import { KIHPanel } from './panels';

export interface IBootLoader {
	init1() : Promise<void>;
	fatal(err: any) : void;
	check() : void;
	platformInfo() : any;
}

export interface IKatexInputHelper {
	initialise() : Promise<void>; 
}

export interface ILocalizer {
	currentLocale: string;
	subscribe(func: any, ...args: any);
	load(langCode: string) : Promise<void>;
	getLocalText(code: string) : string;
	initialiseLanguageChoice(localType: string) : Promise<void>;
	buildLocalResources() : Promise<void>;
}

export interface IMessager {
	error(msgKey: string, e: any);
	show(titleKey: string, msgKey: string, e);
}

export interface IUtilities {
	getOption(id: string, option: string) : string;
	localizeOption(id: string, option: string) : string;
}

export interface IThemes {
	initialiseThemeChoice(activeTheme: string, dir: string) : Promise<void>;
	activateStyle(activeTheme: string) : Promise<void>;
	setRTLstyle(dir: string) : Promise<void>;
}

export interface IParser {
	initialise();
	parseAsync(selector: string, ctx: any, delay: number) : Promise<void>;
}

export interface IMath {
	
}

export interface IPanels {
	showWindowGeneric<T extends KIHPanel>(ctor: new(id: string, ...params: any[]) => T, id: string, ...params: any) : Promise<void>;
}

export const bootLoaderId = Symbol.for('BootLoaderId');
export const platformInfoId = Symbol.for('PlatFormInfoId');
export const katexInputHelperId = Symbol.for('KatexInputHelperId');
export const parametersId = Symbol.for('ParametersId');
export const localizerId = Symbol.for('LocalizerId');
export const messagerId = Symbol.for('MessagerId');
export const utilitiesId = Symbol.for('UtilitiesId');
export const themesId = Symbol.for('ThemesId');
export const parserId = Symbol.for('ParserId');
export const mathId = Symbol.for('MathId');
export const panelsId = Symbol.for('PanelsId');
