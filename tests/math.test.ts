import { it, expect, describe, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import fs from 'fs-extra';
import path from 'path';

import { before, after, getRandomIndices } from './lib';
import { container } from './container';
import { IMath, mathId, IMessager, messagerId } from '@/js/interfaces';
import { ISupplement, supplementId } from './interfaces';

// Use this constant to control number of anchor tests per formula file
const count = 5;
const selector: string = '#test-container > table, #test-container > div';

beforeAll(async () => { 
	await before();
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
	});
	
	it('math class can be instantiated', () => {		
		expect(container.get<IMath>(mathId)).not.toBeNull();
	});
	
	it('can render simple formula', () => {
		const math = container.get<IMath>(mathId);
		const target = $('<div></div>')[0];
		math.insertMath('\\LaTeX', target);
		expect($(target).find('.katex').length).toBe(1);
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
});


describe('Math table tests', async () => {
	
	function listFormulaFolder() :[number, string, string][] {
		const folder = 'src/assets/formulas';
		const formulaFiles : [number, string, string][] = fs.readdirSync(folder)
			.filter((file: string) => file.endsWith('.html'))
			.map((file: string, idx: number) => [idx, file, folder]);
		
		return formulaFiles;
	}
	
	function readFormulaFile(file: string, folder: string) : string {
		const filePath = path.join(folder, file);
		const html = fs.readFileSync(filePath, { encoding: 'utf-8' });

		return html;		
	}
	
	function getSelectedAnchors(isMatrixPanel: boolean) : [number, HTMLElement][] {
		const anchors: [number, HTMLElement][] = 
			$('#test-container a.s').toArray()
			.map((val, idx, _array) => [ idx + 1, val ]);		
		const exclude = isMatrixPanel ? [9, 10, 11] : [];
		const idxs = getRandomIndices(anchors.length, count, exclude);
		const selectedAnchors = anchors.filter((_val, idx) => idxs.includes(idx));
		
		return selectedAnchors;
	}
	
	async function prepareData() {
		// THIS before is essential because 'prepareData' is called before : 'beforeAll' is invoked
		await before();
		
		const formulaFiles = listFormulaFolder();
		const data: [string, JQuery<HTMLElement>, ([number, HTMLElement][])][] = [];
		for (const [ _idx, file, folder] of formulaFiles) {
			const html = readFormulaFile(file, folder);
			const htmlFragment = $(html);
			$(selector).replaceWith(htmlFragment);
			const selectedAnchors = getSelectedAnchors(file == 'f_MATRIX_SYMBOLS.html');
			data.push([ file, htmlFragment, selectedAnchors ]);
		}
		
		return data;
	}
	
	const data = await prepareData();
	
	describe.for(data)(`test formula file : %s`, ([ file, htmlFragment, selectedAnchors ]) => {

		beforeEach(() => {
			$(selector).replaceWith(htmlFragment);
		});

		it('could simply read the formula file', () => {
			expect($('#test-container').html()).toMatch(/table|div/);
			expect($(selector).length).toBe(1);
			expect($('#test-container a.s').length).toBeGreaterThanOrEqual(3);
		});

		describe.for(selectedAnchors)('test anchor %d', ([ idx, anchor ]) => {
			function prepareMath() : IMath {
				const math = container.get<IMath>(mathId);
				container.get<ISupplement>(supplementId);
				math.insert('');

				return math;				
			}
			
			const failedMsg = `failed on anchor ${idx} : ${anchor.outerHTML}`;
			
			it('can convert single anchor', () => {
				const math = prepareMath();
				math.updateTableAnchor(anchor);
				expect($(anchor).find('.katex,img').length, failedMsg).toBeGreaterThan(0);
			});
			
			it('inserts on click', () => {
				const math = prepareMath();
				$(anchor).trigger('click');
				expect(math.codeMirror.getValue().length, failedMsg).toBeGreaterThan(0);
			});

			it('evaluates on click', () => {
				prepareMath();
				$(anchor).trigger('click');
				const mathEx = $('#mathVisualOutput .katex');
				expect(mathEx.length, failedMsg).toBeGreaterThan(0);
			});
			
			it('not calling messager on click', () => {
				prepareMath();
				const messager = container.get<IMessager>(messagerId);
				const spyShow = vi.spyOn(messager, 'show');
				
				$(anchor).trigger('click');
				expect(spyShow).not.toBeCalled();
				spyShow.mockClear();
			});
		});		
	});
});


afterAll( () => { 
	after();
});
