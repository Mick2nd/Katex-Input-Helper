import { it, describe } from 'vitest';
import fs from 'fs-extra';
import path from 'path';


describe('Comments tests', async () => {
	
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
	
	function getComments(html: string) : [number, string][] {
		const comments: [number, string][] = [];
		let idx = 0; 
		for (const match of html.matchAll(/<!--(.*?)-->/mgs)) {
			idx ++;
			comments.push([idx, match[1]]);
		}
		
		return comments;
	}
	
	async function prepareData() {
		const formulaFiles = listFormulaFolder();
		const data: [string, JQuery<HTMLElement>, ([number, string][])][] = [];
		for (const [ _idx, file, folder] of formulaFiles) {
			const html = readFormulaFile(file, folder);
			const htmlFragment = $(html);
			const comments = getComments(html);
			data.push([ file, htmlFragment, comments ]);
		}
		
		return data;
	}
	
	const data = await prepareData();
	
	describe.for(data)(`comments of formula file : %s`, ([ file, htmlFragment, comments ]) => {

		it('print all comments', () => {
			for (const [ _idx, comment ] of comments) {
				console.info(comment);
			}
		})
	});
});

