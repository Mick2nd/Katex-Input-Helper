import { it, expect, beforeEach, afterEach, beforeAll, afterAll, describe } from 'vitest';
import { before, after } from './lib';
import fs from 'fs-extra';

beforeAll( async() => { await before() });

it('test test', () => {
	expect(true, 'message').toBeTruthy();
});

it('can load formula file', () => {
	let html = fs.readFileSync('src/assets/formulas/f_BRACKET_SYMBOLS_MORE.html', { encoding: 'utf-8' }); // properly loaded
	let htmlFragment = $(html);
	
	expect($(htmlFragment).length).toBe(1);
	expect($(htmlFragment).find('a.s').length).toBeGreaterThan(5);
});

const data = [
	{ 
		idx: 1,
		nested: [1, 2, 3]
	},
	{ 
		idx: 2,
		nested: [51, 52, 53]
	},
	{ 
		idx: 3,
		nested: [71, 72, 73, 74]
	},
];

describe.for(data)('Outer test set', ({idx, nested}) => {
	it('Outer test', () => {
		expect(idx + 1).toBeGreaterThan(idx);
	});
	
	describe.for(nested)('Inner test set', ( no ) => {
		it('Inner test', () => {
			expect(no - 1).toBeLessThan(no);
		});
	});
})

afterAll( after );

