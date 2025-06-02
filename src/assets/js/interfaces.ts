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
	show(titleKey: string, msgKey: string, e?: any);
}

export interface IUtilities {
	getOption(id: string, option: string) : string;
	localizeOption(id: string, option: string) : string;
}

export interface IThemes {
	initialiseThemeChoice(activeTheme: string, dir: string) : Promise<void>;
	activateStyle(activeTheme: string) : Promise<void>;
	setRTLstyle(dir: string) : void;
	subscribe(func: any, ...args: any);
}

export interface IParser {
	initialise();
	parseAsync(selector: string, ctx?: any, delay?: number) : Promise<void>;
}

export interface IMath {
	equipWithInteractivity(a: any, javascript: boolean);
	equipWithTooltip(selector: any, text: string, javascript: boolean);
	inplaceUpdate(selector: any, javascript: boolean);
	insert(b: any);
	insertMath(text: string, element: any, multiple: boolean, displayMode: boolean);
	codeMirror: any;
	setFocus();
	updateAnchor(a: any);
	updateHeaders(selector: string);
	updateLatexMenu();
	updateOutput();
	updateTables() : Promise<void>;
}

export interface ICodeMirror {
	replaceSelection(b: string);
	getSelection() : string;
	setValue(val: string|ArrayBuffer);
	getValue() : string;
	focus();
	lastLine() : number;
	setCursor(cursor: any);
	getCursor() : any;
	setOption(option: string, val: any);
	on(evt: string, handler: any);
	version?: string;
}

export interface IPanels {
	showWindowDI(wndId: any, id: string, ...params: any);
}

export interface ICategoriesTree {
	nodeSelected: any;
	treeChanged: any;
	equationMoved: any;
	currentLeaf: any;
	deleteEquations(from: any, checked: any);
	set currentEquations(value: any);
	get currentEquations() : any;
	get customEquationsProxy() : any;
	setCustomEquations(value: any) : Promise<void>;
	getCheckedEquations() : number[];
}

export const bootLoaderId = Symbol.for('BootLoaderId');
export const platformInfoId = Symbol.for('PlatFormInfoId');
export const katexInputHelperId = Symbol.for('KatexInputHelperId');
export const katexInputHelperFactoryId = Symbol.for('KatexInputHelperFactoryId');
export const parametersId = Symbol.for('ParametersId');
export const localizerId = Symbol.for('LocalizerId');
export const messagerId = Symbol.for('MessagerId');
export const utilitiesId = Symbol.for('UtilitiesId');
export const themesId = Symbol.for('ThemesId');
export const parserId = Symbol.for('ParserId');
export const mathId = Symbol.for('MathId');
export const panelsId = Symbol.for('PanelsId');

export const dynamicPanelId = Symbol.for('DynamicPanelId');
export const informationWindowId = Symbol.for('InformationWindowId');
export const moreDialogId = Symbol.for('MoreDialogId');
export const windowId = Symbol.for('WindowId');
export const matrixWindowId = Symbol.for('MatrixWindowId');
export const unicodeWindowId = Symbol.for('UnicodeWindowId');
export const panelFactoryId = Symbol.for('PanelFactoryId');
export const dynamicParametersId = Symbol.for('DynamicParametersId');
export const categoriesTreeId = Symbol.for('CategoriesTreeId');
