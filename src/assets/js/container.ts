import { Container } from 'inversify';
import { IBootLoader, bootLoaderId, katexInputHelperId, localizerId, messagerId, platformInfoId, utilitiesId, parametersId, themesId, parserId, mathId, panelsId } from './interfaces';
import { BootLoader } from './bootloader';
import { KatexInputHelper } from './dialog';
import { ParametersProxy } from './parameters';
import { Localizer } from './localization';
import { Messager, Utilities } from './helpers';
import { Themes } from './themes';
import { ParserExtension } from './parserExtension';
import { MathFormulae } from './math';
import { KIHPanels } from './panels';

export const container = new Container();

container.bind(bootLoaderId).to(BootLoader).inSingletonScope();
container.bind(katexInputHelperId).to(KatexInputHelper).inSingletonScope();
container.bind(parametersId).toDynamicValue(ParametersProxy).inSingletonScope();
container.bind(localizerId).to(Localizer).inSingletonScope();
container.bind(messagerId).to(Messager).inSingletonScope();
container.bind(utilitiesId).to(Utilities).inSingletonScope();
container.bind(themesId).to(Themes).inSingletonScope();
container.bind(parserId).to(ParserExtension).inSingletonScope();
container.bind(mathId).to(MathFormulae).inSingletonScope();
container.bind(panelsId).to(KIHPanels).inSingletonScope();

const bootLoader: IBootLoader = container.get(bootLoaderId);
container.bind(platformInfoId).toDynamicValue(bootLoader.platformInfo.bind(bootLoader));

try {
	await bootLoader.init1();
	bootLoader.check();
	
} catch(err) {
	console.error(`Error ${err} `, err);
	bootLoader.fatal(err);
}
