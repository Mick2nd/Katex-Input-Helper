import { it, expect, describe, vi, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

import { before, after } from './lib';
import Observable from '../src/assets/js/patterns/observable';
import Localizer from '../src/assets/js/localization';


beforeEach( before );

it('test test', () => {
	expect(true).toBeTruthy();
});

it('can instantiate localizer', () => {
	var factory = () => { 
		new Localizer(Observable); 
	};
	expect(factory).not.toThrow();
});

it('can load valid locale', async () => {
	const validLocale = "de_DE";
	var localizer = new Localizer(Observable);
	var throwable = async () => {
		await localizer.load(validLocale);
	};
	await expect(throwable()).resolves.toBeUndefined();
});

it('cannot load invalid locale', async () => {
	const invalidLocale = "XYZ";
	var localizer = new Localizer(Observable);
	var throwable = async () => {
		await localizer.load(invalidLocale);
	};
	await expect(throwable()).rejects.toThrow(/Failed to parse URL/);
});

afterEach( after );
