
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
	subscribe(func: any, ...args: any) : void;
	load(langCode: string) : Promise<void>;
	getLocalText(code: string) : string;
	initialiseLanguageChoice(localType: string) : Promise<void>;
	buildLocalResources() : Promise<void>;
}

export interface IMessager {
	error(msgKey: string, e: any) : void;
	show(titleKey: string, msgKey: string, e?: any) : void;
}

export interface IUtilities {
	getOption(id: string, option: string) : string;
	localizeOption(id: string, option: string) : string;
}

export interface IThemes {
	initialiseThemeChoice(activeTheme: string, dir: string) : Promise<void>;
	activateStyle(activeTheme: string) : Promise<void>;
	setRTLstyle(dir: string) : void;
	subscribe(func: any, ...args: any) : void;
}

export interface IParser {
	initialise() : void;
	parseAsync(selector: string, ctx?: any, delay?: number) : Promise<any>;
}

export interface IMath {
	equipWithInteractivity(a: any, javascript: boolean) : void;
	equipWithTooltip(selector: any, text: string, javascript: boolean) : void;
	inplaceUpdate(selector: any, javascript: boolean) : void;
	insert(b: any) : void;
	insertMath(text: string, element: any, multiple?: boolean, displayMode?: boolean) : void;
	codeMirror: any;
	setFocus() : void;
	updateAnchor(a: any) : void;
	updateTableAnchor(a: any) : void;
	updateHeaders(selector: string) : void;
	updateLatexMenu() : void;
	updateOutput() : void;
	updateTables() : Promise<void>;
}

export interface ICodeMirror {
	replaceSelection(b: string) : void;
	getSelection() : string;
	setValue(val: string|ArrayBuffer) : void;
	getValue() : string;
	focus() : void;
	lastLine() : number;
	setCursor(cursor: any) : void;
	getCursor() : any;
	setOption(option: string, val: any) : void;
	on(evt: string, handler: any) : void;
	version?: string;
}

export interface IPanels {
	showWindowDI(wndId: any, id: string, ...params: any) : void;
}

export interface IPanel {
	onMove(left: number, top: number) : void;
	onResize(width: number, height: number) : void;
	onClose() : void;
	get handlers() : any;
	initialise(dummy?: any) : Promise<void>;
	update(...params: any) : Promise<void>;
	show() : Promise<void>;
	resize() : void;
	open() : void;
	toggle() : void;
}

export interface ICategoriesTree {
	nodeSelected: any;
	treeChanged: any;
	equationMoved: any;
	currentLeaf: any;
	deleteEquations(from: any, checked: any) : void;
	set currentEquations(value: any);
	get currentEquations() : any;
	get customEquationsProxy() : any;
	setCustomEquations(value: any) : Promise<void>;
	getCheckedEquations() : number[];
}

export const asyncId = Symbol.for('AsyncId');
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
export const codeMirrorId = Symbol.for('CodeMirrorId');
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
