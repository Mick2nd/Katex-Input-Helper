import { it, expect, describe, vi, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

import { before, after } from './lib';
import { Messager } from '../src/assets/js/helpers';


beforeEach( before );

it('test test', () => {
	expect(true).toBeTruthy();
});

afterEach( after );
