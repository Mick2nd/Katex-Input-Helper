import { IMessager } from '@/js/interfaces';

export class MessagerFake implements IMessager {
	error(msgKey: string, e: any) { }
	show(titleKey: string, msgKey: string, e?: any) { }
}