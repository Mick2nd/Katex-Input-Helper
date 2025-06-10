import { Container } from 'inversify';
import { ILocalizer, localizerId, IMessager, messagerId, IUtilities, utilitiesId, parametersId, 
	IParser, parserId, IMath, mathId, asyncId, ICodeMirror, codeMirrorId } from '../src/assets/js/interfaces';
import { codeMirrorOriginalId, supplementId, ISupplement } from './interfaces';
	
import { ParametersProxy } from '../src/assets/js/parameters';
import { Localizer } from '../src/assets/js/localization';
import { Utilities } from '../src/assets/js/helpers';
import { ParserExtension } from '../src/assets/js/parserExtension';
import { MathFormulae } from '../src/assets/js/math';
import { codeMirrorProxy } from '../src/assets/js/codeMirrorProxy';
import { codeMirrorFakeProxy } from '../__mocks__/codeMirrorProxy';
import { MessagerFake } from '../__mocks__/messager';
import { Supplement } from '../__mocks__/supplement';

export const container = new Container();

container.bind(asyncId).toConstantValue(true);
container.bind(parametersId).toDynamicValue(ParametersProxy).inSingletonScope();
container.bind<ILocalizer>(localizerId).to(Localizer).inSingletonScope();
container.bind<IMessager>(messagerId).to(MessagerFake).inSingletonScope();
container.bind<IUtilities>(utilitiesId).to(Utilities).inSingletonScope();
container.bind<IParser>(parserId).to(ParserExtension).inSingletonScope();
container.bind<IMath>(mathId).to(MathFormulae).inSingletonScope();
container.bind<ICodeMirror>(codeMirrorOriginalId).toDynamicValue(codeMirrorProxy).inSingletonScope();
container.bind<ICodeMirror>(codeMirrorId).toDynamicValue(() => codeMirrorFakeProxy(container.get(codeMirrorOriginalId))).inSingletonScope();
container.bind<ISupplement>(supplementId).to(Supplement).inSingletonScope();