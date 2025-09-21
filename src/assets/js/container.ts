import { Container, ResolutionContext, Factory } from 'inversify';

import { IBootLoader, bootLoaderId, katexInputHelperId, IKatexInputHelper, katexInputHelperFactoryId, 
	ILocalizer, localizerId, IMessager, messagerId, platformInfoId, 
	IUtilities, utilitiesId, parametersId, IThemes, themesId, IParser, parserId, IMath, mathId, 
	IPanels, panelsId, dynamicPanelId, informationWindowId, moreDialogId, windowId, matrixWindowId, 
	dynamicParametersId, panelFactoryId, unicodeWindowId, categoriesTreeId, ICategoriesTree, asyncId,
	codeMirrorId, ICodeMirror } from './interfaces';

import { BootLoader } from './bootLoader';
import { KatexInputHelper } from './dialog';
import { ParametersProxy } from './parameters';
import { Localizer } from './localization';
import { Messager, Utilities } from './helpers';
import { Themes } from './themes';
import { ParserExtension } from './parserExtension';
import { MathFormulae } from './math';
import { KIHPanels, KIHPanel, DynamicPanel, MatrixWindow, InformationWindow, KIHMoreDialog, KIHWindow, UnicodeWindow } from './panels';
import { CategoriesTree } from './categoriesTree';
import { codeMirrorProxy } from './codeMirrorProxy';

const container = new Container();

container.bind(asyncId).toConstantValue(true);
container.bind<IBootLoader>(bootLoaderId).to(BootLoader).inSingletonScope();
container.bind<IKatexInputHelper>(katexInputHelperId).to(KatexInputHelper).inSingletonScope();
container.bind(parametersId).toDynamicValue(ParametersProxy).inSingletonScope();
container.bind<ILocalizer>(localizerId).to(Localizer).inSingletonScope();
container.bind<IMessager>(messagerId).to(Messager).inSingletonScope();
container.bind<IUtilities>(utilitiesId).to(Utilities).inSingletonScope();
container.bind<IThemes>(themesId).to(Themes).inSingletonScope();
container.bind<IParser>(parserId).to(ParserExtension).inSingletonScope();
container.bind<IMath>(mathId).to(MathFormulae).inSingletonScope();
container.bind<IPanels>(panelsId).to(KIHPanels).inSingletonScope();
container
	.bind<Factory<IKatexInputHelper>>(katexInputHelperFactoryId)
	.toFactory((context: ResolutionContext) : () => IKatexInputHelper => {
		return () => context.get(katexInputHelperId);
	});
container
	.bind<ICodeMirror>(codeMirrorId)
	.toDynamicValue(codeMirrorProxy)
	.inSingletonScope();
	
container.bind<KIHPanel>(dynamicPanelId).to(DynamicPanel);
container.bind<KIHPanel>(informationWindowId).to(InformationWindow);
container.bind<KIHPanel>(moreDialogId).to(KIHMoreDialog);
container.bind<KIHPanel>(windowId).to(KIHWindow);
container.bind<KIHPanel>(matrixWindowId).to(MatrixWindow);
container.bind<KIHPanel>(unicodeWindowId).to(UnicodeWindow);

container.bind<ICategoriesTree>(categoriesTreeId).to(CategoriesTree).inSingletonScope();

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
container.bind(platformInfoId).toDynamicValue(bootLoader.platformInfo.bind(bootLoader));

try {
	await bootLoader.init1();
	bootLoader.check();
	
} catch(err) {
	console.error(`Error ${err} `, err);
	bootLoader.fatal(err);
}
