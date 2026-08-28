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
	menusId, IMenus,
	hintsId, IHints,
	selectedServicesId, ISelectedServices } from './interfaces.mjs';

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
import { Hints } from './hints.mjs';


class SelectedServices implements ISelectedServices {
	container: Container;
	
	constructor(container: Container) {
		this.container = container;
	}
	
	get hints() : IHints {
		return this.container.get(hintsId);
	}
	
	get localizer() : ILocalizer {
		return this.container.get(localizerId);
	}

	get parameters() : any {
		return this.container.get(parametersId);
	}

	get utilities() : IUtilities {
		return this.container.get(utilitiesId);
	}

	get parser() : IParser {
		return this.container.get(parserId);
	}

	get math() : IMath {
		return this.container.get(mathId);
	}

	get messager() : IMessager {
		return this.container.get(messagerId);
	}

	getLocalText(key: string) : string {
		return this.localizer.getLocalText(key);
	}
}

/**
 * Includes all services of the DI framework.
 */
class ContainerProxy {
	container: Container;
	
	/**
	 * Constructor
	 */
	constructor() {
		this.container = new Container();
	}
	
	/**
	 * Prepares the bindings.
	 */
	async prepare() {

		this.container.bind(asyncId).toConstantValue(true);

		/*	Intent is to provide a common method for asynchronous registration.
		 *	Code below is working. The only specific piece is the file name. Probably
		 *	this will result in file load error -> Working with the given signature.
		 */

		const inst = this;
		async function register<TIfc>(id: Symbol, file: string) {
			const rawSymbol = Symbol.for(id.toString() + 'raw');
			
			inst.container.bind<Factory<TIfc>>(id.valueOf()).toFactory(
				async function (context: any) : Promise<Factory<TIfc>> { 
					try {
						const cls = ((await import(/* webpackChunkName: 'categoriesTree' */ `./post-load/categoriesTree.mjs`)).default) as Newable<TIfc, []>;
						inst.container.bind<TIfc>(rawSymbol).to(cls);
						const service : Factory<TIfc> = () => context.get(rawSymbol);
						console.debug(`CategoriesTree instantiated.`);
						return service;
					} catch(e) {
						console.error(`Error in toDynamicValue : %s`, e);
						throw e;
					}
				});
		}


		this.container.bind<IEasyuiLoader>(easyuiLoaderId).to(EasyuiLoader).inSingletonScope();
		this.container.bind<IBootLoader>(bootLoaderId).to(BootLoader).inSingletonScope();
		this.container.bind<IKatexInputHelper>(katexInputHelperId).to(KatexInputHelper).inSingletonScope();
		this.container.bind<ILocalizer>(localizerId).to(Localizer).inSingletonScope();
		this.container.bind(parametersId).toDynamicValue(ParametersProxy).inSingletonScope();
		this.container.bind<IMessager>(messagerId).to(Messager).inSingletonScope();
		this.container.bind<IUtilities>(utilitiesId).to(Utilities).inSingletonScope();
		this.container.bind<IThemes>(themesId).to(Themes).inSingletonScope();
		this.container.bind<IParser>(parserId).to(ParserExtension).inSingletonScope();
		this.container.bind<IMath>(mathId).to(MathFormulae).inSingletonScope();
		this.container.bind<IPanels>(panelsId).to(KIHPanels).inSingletonScope();
		this.container.bind<IMenus>(menusId).to(Menus).inSingletonScope();
		this.container.bind<IHints>(hintsId).to(Hints).inSingletonScope();
		this.container.bind<ISelectedServices>(selectedServicesId)
			.toDynamicValue(() => new SelectedServices(this.container)).inSingletonScope();

		this.container
			.bind<Factory<IKatexInputHelper>>(katexInputHelperFactoryId)
			.toFactory((context: ResolutionContext) : () => IKatexInputHelper => {
				return () => context.get(katexInputHelperId);
			});

		this.container
			.bind<Factory<ICodeMirror>>(codeMirrorFactoryId)
			.toFactory((_context: ResolutionContext) : (isMobile: boolean) => ICodeMirror => {
				return (isMobile: boolean) => new CodeMirrorProxy(isMobile);
			});
			
		this.container.bind<KIHPanel>(dynamicPanelId).to(DynamicPanel);
		this.container.bind<KIHPanel>(informationWindowId).to(InformationWindow);
		this.container.bind<KIHPanel>(moreDialogId).to(KIHMoreDialog);
		this.container.bind<KIHPanel>(windowId).to(KIHWindow);
		this.container.bind<KIHPanel>(dialogId).to(KIHDialog);
		this.container.bind<KIHPanel>(matrixWindowId).to(MatrixWindow);
		this.container.bind<KIHPanel>(unicodeWindowId).to(UnicodeWindow);

		await register<ICategoriesTree>(categoriesTreeId, 'categoriesTree');

		let allParams: any[] = [ ];
		this.container.bind(dynamicParametersId).toDynamicValue(() => allParams);

		this.container
			.bind<Factory<KIHPanel>>(panelFactoryId)
			.toFactory((context: ResolutionContext) : (...p: any) => KIHPanel => {
				return (wndId: any, id: string, parent: any, ...params: any) => {
					/*
					const math = context.get(mathId);
					const localizer = context.get(localizerId);
					const parameters = context.get(parametersId);
					const messager = context.get(messagerId);
					const parser = context.get(parserId);
					allParams = [];
					allParams.push(math, localizer, parameters, messager, parser, id, parent, ...params);
					*/
					const selectedServices = context.get(selectedServicesId);
					allParams = [];
					allParams.push(selectedServices, id, parent, ...params);
					return context.get<KIHPanel>(wndId);	
				};
			});

		console.inject(this.container.get(messagerId));
	}
	
	/**
	 * Starts the application.
	 */
	async start() {
		const bootLoader: IBootLoader = this.container.get(bootLoaderId); 
		try {
			await bootLoader.initApp();
			
		} catch(err) {
			console.error(`Error ${err} `, err);
			console.trace('Init error stack trace');
			bootLoader.fatal(err);
		}
	}
}


const proxy = new ContainerProxy();
await proxy.prepare();
await proxy.start();
