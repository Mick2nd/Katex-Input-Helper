import { vi } from 'vitest';
import { JSDOM } from 'jsdom';
import path from 'path';

function addScript(path: string) {
	const scriptTag = `<script defer src="${path}"></script>`
	$(scriptTag).appendTo('head');
}

export async function before(withScripts: boolean = false) : Promise<void> {
	
	const projFolder = process.cwd();
	const baseUrl = `file:///${projFolder}/src/assets/`;
	const htmlPath = path.join(projFolder, 'src/assets/dialog.html');
	const dom = await JSDOM.fromFile(htmlPath, { url: baseUrl, runScripts: "dangerously" });
	
	vi.stubGlobal('document', dom.window.document);
	vi.stubGlobal('window', dom.window);

	const root = dom.window.document.getElementsByTagName('html')[0].cloneNode(true);
	$('html').replaceWith(root as Element);
	if (withScripts) {
		addScript("./js/jquery-easyui/jquery.easyui.min");
	}
}

export function after() {
	vi.unstubAllGlobals();
}

module.exports = { before, after };
