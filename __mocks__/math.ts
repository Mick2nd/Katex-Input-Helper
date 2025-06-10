import './jquery-easyui/jquery.easyui.min';						// ADDED for unit test
import { it, expect, describe, vi, beforeEach, afterEach } from 'vitest';
import { IMath } from '@/js/interfaces';
import { container } from './tests/container';

/*	DID NOT WORK as MOCK
*/
export class MathFormulae implements IMath {
	constructor(p1, p2, p3, p4) {
		console.info('Here in mocked ctor');
		throw Error('Messager is not defined');
	}
	
	equipWithInteractivity(a: any, javascript: boolean) { }
	equipWithTooltip(selector: any, text: string, javascript: boolean) { }
	inplaceUpdate(selector: any, javascript: boolean) { }
	insert(b: any) { }
	insertMath(text: string, element: any, multiple: boolean, displayMode: boolean) { }
	codeMirror: any;
	setFocus() { }
	updateAnchor(a: any) { }
	updateHeaders(selector: string) { }
	updateLatexMenu() { }
	updateOutput() { }
	updateTables() : Promise<void> { return new Promise<void>(); }
}

// This helps to import symbols in test suite
try {
	module.exports = { MathFormulae };
} catch(e) { }
