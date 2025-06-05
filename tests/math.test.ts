import { it, expect, describe, vi, beforeEach, afterEach, beforeAll } from 'vitest';

import { before, after } from './lib';
import { container } from './container';
import { IMath, mathId, IMessager, messagerId } from '@/js/interfaces';


beforeAll(async () => { 
	//await before();
});

beforeEach(async () => { 
	await before(false);
});

it('$ is defined', () => {
	expect($).not.toBeUndefined();
});

it('Dom text area for Code Mirror does exist', () => {
	expect($("#mathTextInput").length).toBe(1);
});

it('cwd() provides project folder', () => {
	let cwd = process.cwd();
	expect(cwd).toMatch(/[\\/]Katex Input Helper$/);
});

it('Dom has myContainer element', () => {
	expect(document.getElementById('myContainer')).not.toBeNull();
	expect(document.getElementById('myContainer')).toBeInstanceOf(document.defaultView!.HTMLDivElement);
	expect($('#myContainer').length).toBe(1);
});

describe('Specific Math tests', () => {
	beforeEach(async () => { 
		await before(false);
		vi.resetModules();
	});
	
	it('math class can be instantiated', () => {
		
		// With this mock works less than without it: "panel is not a function"
		/*
		vi.mock('@/js/jquery-easyui/jquery.easyui.min', () => {
			return {
				panel: vi.fn().mockReturnValue({ onResizePanel: null })
			};
		});
		*/
		expect(container.get<IMath>(mathId)).not.toBeNull();
	});
	
	it('can render simple formula', () => {
		const math = container.get<IMath>(mathId);
		const target = $('<div></div>')[0];
		math.insertMath('\\LaTeX', target);
		expect($(target).children().first().hasClass('katex')).toBeTruthy();
	});

	it('cannot render simple erroneous formula', () => {
		const math = container.get<IMath>(mathId);
		const target = $('<div></div>')[0];
		const messager = container.get<IMessager>(messagerId);
		const spy = vi.spyOn(messager, 'show');
		math.insertMath('\\LaTe', target);
		expect($(target).children().length).toBe(0);
		expect(spy).toHaveBeenCalledTimes(1);
	});

	afterEach( () => { 
		after();
		vi.resetAllMocks();
	});
});

afterEach( () => { 
	after();
});
