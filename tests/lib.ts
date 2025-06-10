import { vi } from 'vitest';
import { JSDOM } from 'jsdom';
import path from 'path';

function addScript(path: string) {
	const scriptTag = `<script defer src="${path}"></script>`
	$(scriptTag).appendTo('head');
}
	
/**
 * Converts a method with given signature and callback to a Promise returning method
 * 
 * @param ob - an object to be bound to the function parameter
 * @param fnc - a function object to be invoked
 * @param args - args of the function. The function has one additional callback parameter
 * @returns the Promise, will be fulfilled if the callback is invoked
 */
export async function promisify(fnc: any, ...args: any)
{
	return new Promise((resolve, reject) =>
	{			
		fnc(...args, (err: any, result: any) => {
			
		if (err)
		{
			console.error('Error occurred: ' + err)		
			reject(err);
		}
		else
		{
			resolve(result);
		}});
	});
}

/**
 * The promise is fulfilled if the document becomes ready.
 * 
 * @async implements the Promise contract
 */
async function readyAsync(dom) {
	let doc = $(dom.window.document);
	return promisify(doc.ready.bind(doc));
}

/**
 * To be invoked to prepare JSDOM document with **'dialog.html'** content.
 */
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
	
	$('body')[0].appendChild($('<div id="test-container"><table></table></div>')[0]);
}

/**
 * To be invoked to finalize tests.
 */
export function after() {
	vi.unstubAllGlobals();
}

/**
 * Builds an array of random numbers out of [0..max-1]. Can be used for array item selection.
 * 
 * @param max - the maximum number + 1
 * @param count - the number of numbers to return
 * @returns array of numbers
 */
export function getRandomIndices(max: number, count: number, exclude: number[]) : number[] {
	const excludeCount = exclude.length;
	const maxCount = max - excludeCount;
	count = Math.min(count, maxCount);
	// case 1 : maximum range excluding given numbers
	if (count == maxCount) {
		const range = Array.from({ length: max }, (_value, index) => index);
		return range.filter(idx => !exclude.includes(idx));
	}
	// case 2 : random numbers, where a minimum of one number must be left over
	let result: number[] = [];
	for (let idx = 0; idx < count; idx++) {
		while(true) {
			const rnd = Math.min(Math.floor(Math.random() * max), max - 1);
			if (!result.includes(rnd) && !exclude.includes(rnd)) {
				result.push(rnd);
				break;
			}
		}
	}
	return result;
}

module.exports = { before, after };
