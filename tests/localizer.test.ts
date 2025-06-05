import { it, expect, describe, vi, beforeEach, afterEach } from 'vitest';

import { before, after } from './lib';
import { container } from './container';
import { ILocalizer, localizerId } from '@/js/interfaces';


it('test test', () => {
	expect(true).toBeTruthy();
});

describe('Localizer tests', () =>{
	
	beforeEach( before );
	
	it('can instantiate localizer', () => {
		let factory = () => { 
			container.get(localizerId); 
		};
		expect(factory).not.toThrow();
	});

	it('can load valid locale', async () => {
		const validLocale = "de_DE";
		let localizer = container.get<ILocalizer>(localizerId);
		let throwable = async () => {
			await localizer.load(validLocale);
		};
		await expect(throwable()).resolves.toBeUndefined();
	});

	it('cannot load invalid locale', async () => {
		const invalidLocale = "XYZ";
		let localizer = container.get<ILocalizer>(localizerId);
		let throwable = async () => {
			await localizer.load(invalidLocale);
		};
		await expect(throwable()).rejects.toThrow(/Unknown variable dynamic import/);
	});

	afterEach( after );
});

