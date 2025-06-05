import { Container } from 'inversify';
import { ILocalizer, localizerId, IMessager, messagerId, IUtilities, utilitiesId, parametersId, IParser, parserId, IMath, mathId } from '@/js/interfaces';

import { ParametersProxy } from '../src/assets/js/parameters';
import { Localizer } from '../src/assets/js/localization';
import { Utilities } from '../src/assets/js/helpers';
import { ParserExtension } from '../src/assets/js/parserExtension';
import { MathFormulae } from '../src/assets/js/math';
import { Messager } from '../__mocks__/messager';

export const container = new Container();

container.bind(parametersId).toDynamicValue(ParametersProxy).inSingletonScope();
container.bind<ILocalizer>(localizerId).to(Localizer).inSingletonScope();
container.bind<IMessager>(messagerId).to(Messager).inSingletonScope();
container.bind<IUtilities>(utilitiesId).to(Utilities).inSingletonScope();
container.bind<IParser>(parserId).to(ParserExtension).inSingletonScope();
container.bind<IMath>(mathId).to(MathFormulae).inSingletonScope();
