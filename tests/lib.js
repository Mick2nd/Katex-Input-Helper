import { vi } from 'vitest';
import { JSDOM } from 'jsdom';
import path from 'path';


async function before() {
	const projFolder = process.cwd();
	const baseUrl = `file:///${projFolder}/src/assets/`;
	const htmlPath = path.join(projFolder, 'src/assets/dialog.html');
	const dom = await JSDOM.fromFile(htmlPath, { url: baseUrl, runScripts: "outside-only" });
	const localFetch = globalThis.fetch;
	vi.stubGlobal('document', dom.window.document);

	async function fetchStub(relativePath) {
		const absolutePath = path.join(baseUrl, relativePath);
		return await localFetch(absolutePath);
	}

	/**
	 * Only a workaround for the real *fetch*.
	 */
	async function fetchStub2(relativePath) {
		return { json: async () => {} };
	}
	vi.stubGlobal('fetch', fetchStub2);
}

function after() {
	vi.unstubAllGlobals();
}

module.exports = { before, after };
