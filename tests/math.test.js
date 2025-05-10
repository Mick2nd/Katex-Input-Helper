import { it, expect, describe, vi, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import path from 'path';

import { before, after } from './lib';
const MathFormulae = require('../src/assets/js/math');

beforeEach(	before );

it('tests for math class', () => {
	var constructorWrapper = () => {
		new MathFormulae(false);
	};
	
	expect(constructorWrapper).toThrow(/Messager is not defined/);
});

it('cwd() provides project folder', () => {
	expect(process.cwd()).not.toBe('');
});

it('Dom has myContainer element', () => {
	expect(document.getElementById('myContainer')).not.toBeNull();
	expect(document.getElementById('myContainer')).toBeInstanceOf(document.defaultView.HTMLDivElement);
});

afterEach( after );
