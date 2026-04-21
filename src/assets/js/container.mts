import { Container, ResolutionContext, Factory, Newable } from 'inversify';

import { 
	IEasyuiLoader, easyuiLoaderId,
	IBootLoader, bootLoaderId, 
	katexInputHelperId, IKatexInputHelper, katexInputHelperFactoryId, 
	ILocalizer, localizerId, 
	IMessager, messagerId, 
	IUtilities, utilitiesId, 
	parametersId, 
	IThemes, themesId, 
	IParser, parserId, 
	IMath, mathId, 
	IPanels, panelsId, dynamicPanelId, informationWindowId, moreDialogId, windowId, dialogId, matrixWindowId, 
	dynamicParametersId, panelFactoryId, unicodeWindowId, 
	categoriesTreeId, ICategoriesTree, 
	asyncId,
	codeMirrorFactoryId, ICodeMirror, 
	menusId, IMenus } from './interfaces.mjs';

import { EasyuiLoader } from './easyui.mjs';
import { default as BootLoader } from './bootLoader.mjs';
import { KatexInputHelper } from './dialog.mjs';
import { Localizer } from './localization.mjs';
import { ParametersProxy } from './parameters.mjs';
import { Messager, Utilities } from './helpers.mjs';
import { Themes } from './themes.mjs';
import { ParserExtension } from './parserExtension.mjs';
import { MathFormulae } from './math.mjs';
import { KIHPanels, KIHPanel, DynamicPanel, MatrixWindow, InformationWindow, KIHMoreDialog, KIHWindow, KIHDialog, UnicodeWindow } from './panels.mjs';
import { CodeMirrorProxy } from './codeMirrorProxy.mjs';
import { Menus } from './menus.mjs';


const container = new Container();

container.bind(asyncId).toConstantValue(true);

/*	TODO: Intent is to provide a common method for asynchronous registration.
 *	Code below is working. The only specific piece is the file name. Probably
 *	this will result in file load error -> Working with the given signature.
 */

async function register<TIfc>(id: Symbol, file: string) {
	const rawSymbol = Symbol.for(id.toString() + 'raw');
	
	container.bind<Factory<TIfc>>(id.valueOf()).toFactory(
		async function (context: any) : Promise<Factory<TIfc>> { 
			try {
				const cls = ((await import(/* webpackChunkName: 'categoriesTree' */ `./post-load/categoriesTree.mjs`)).default) as Newable<TIfc, []>;
				container.bind<TIfc>(rawSymbol).to(cls);
				const service : Factory<TIfc> = () => context.get(rawSymbol);
				console.debug(`CategoriesTree instantiated.`);
				return service;
			} catch(e) {
				console.error(`Error in toDynamicValue : ${e}`);
				throw e;
			}
		});
}


container.bind<IEasyuiLoader>(easyuiLoaderId).to(EasyuiLoader).inSingletonScope();
container.bind<IBootLoader>(bootLoaderId).to(BootLoader).inSingletonScope();
container.bind<IKatexInputHelper>(katexInputHelperId).to(KatexInputHelper).inSingletonScope();
container.bind<ILocalizer>(localizerId).to(Localizer).inSingletonScope();
container.bind(parametersId).toDynamicValue(ParametersProxy).inSingletonScope();
container.bind<IMessager>(messagerId).to(Messager).inSingletonScope();
container.bind<IUtilities>(utilitiesId).to(Utilities).inSingletonScope();
container.bind<IThemes>(themesId).to(Themes).inSingletonScope();
container.bind<IParser>(parserId).to(ParserExtension).inSingletonScope();
container.bind<IMath>(mathId).to(MathFormulae).inSingletonScope();
container.bind<IPanels>(panelsId).to(KIHPanels).inSingletonScope();
container.bind<IMenus>(menusId).to(Menus).inSingletonScope();
container
	.bind<Factory<IKatexInputHelper>>(katexInputHelperFactoryId)
	.toFactory((context: ResolutionContext) : () => IKatexInputHelper => {
		return () => context.get(katexInputHelperId);
	});

container
	.bind<Factory<ICodeMirror>>(codeMirrorFactoryId)
	.toFactory((_context: ResolutionContext) : (isMobile: boolean) => ICodeMirror => {
		return (isMobile: boolean) => new CodeMirrorProxy(isMobile);
	});
	
container.bind<KIHPanel>(dynamicPanelId).to(DynamicPanel);
container.bind<KIHPanel>(informationWindowId).to(InformationWindow);
container.bind<KIHPanel>(moreDialogId).to(KIHMoreDialog);
container.bind<KIHPanel>(windowId).to(KIHWindow);
container.bind<KIHPanel>(dialogId).to(KIHDialog);
container.bind<KIHPanel>(matrixWindowId).to(MatrixWindow);
container.bind<KIHPanel>(unicodeWindowId).to(UnicodeWindow);

await register<ICategoriesTree>(categoriesTreeId, 'categoriesTree');

let allParams: any[] = [ ];
container.bind(dynamicParametersId).toDynamicValue(() => allParams);

container
	.bind<Factory<KIHPanel>>(panelFactoryId)
	.toFactory((context: ResolutionContext) : (...p: any) => KIHPanel => {
		return (wndId: any, id: string, parent: any, ...params: any) => {
			const math = context.get(mathId);
			const localizer = context.get(localizerId);
			const parameters = context.get(parametersId);
			const messager = context.get(messagerId);
			const parser = context.get(parserId);
			allParams = [];
			allParams.push(math, localizer, parameters, messager, parser, id, parent, ...params);
			return context.get<KIHPanel>(wndId);	
		};
	});

const bootLoader: IBootLoader = container.get(bootLoaderId); 
try {
	await bootLoader.initApp();
	
} catch(err) {
	console.error(`Error ${err} `, err);
	bootLoader.fatal(err);
}
