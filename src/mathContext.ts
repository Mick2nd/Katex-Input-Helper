import joplin from 'api';

/**
 * @abstract Class determines the display mode, e.g. if the KIH dialog is invoked 
 * 			 from inside of a formula block 
 */
export class MathContext {
	
	/**
	 * @abstract Constructor.
	 */
	constructor() {
		
	}
	
	/**
	 * @abstract Determines the display mode.
	 * 
	 * Uses a regular expression search.
	 */
	async displayMode() : Promise<boolean | undefined> {
			
		const note = await this.getValue();										// the whole note text
		const cursorIndex = await this.cursorIndex(note);						// the cursor index inside the text
		
		const re = /(?<![\\$])((\$\$)|\$)([^{].*?)(\1)/sg;						// regex searches for math sections (block or inline)
		for (const match of note.matchAll(re)) {								// through all matches
			
			const sign = match[1];
			const enclosed = match[3];
			console.debug(`parse2 found : ${sign} ${enclosed} ${match[3]} `);
			console.debug(`parse2 (whole match) : %O `, match);
			
			const start = match.index;
			const end = start + match[0].length - 1;
			console.debug(`parse2 from ${start} to ${end}`);
			
			// alert(`detected : regex : ${match[0]} `);
			if (start <= cursorIndex && cursorIndex <= end) {					// is cursor inside match
				if (sign === '$$') return true;
				else return false;
			}
		}
		
		return undefined;
	}
	
	/**
	 * @abstract Loops through each line from cursor to the end of the file and
	 * 			 invokes a given function on each. The function can preemptively 
	 * 			 end the loop.
	 */
	async eachLine(func: (string) => boolean) : Promise<any> {
		
		const cursor = await this.getCursor();
		const line = cursor.line;
		var ch = cursor.ch;
		const last = await this.lastLine();
		
		for (var currentLine = line; currentLine <= last; currentLine++) {

			var lineText = await this.getLine(currentLine);
			lineText = lineText.substring(ch);
			ch = 0;
			if (func(lineText)) break;
		}
	}
	
	/**
	 * @abstract Determines the Cursor index, given the note text.
	 * 
	 * Cursor pos (line, ch) is queried with getCursor command.
	 */
	async cursorIndex(note: string) : Promise<number> {
		
		const cursor = await this.getCursor();
		const line = cursor.line - await this.firstLine();
		const ch = cursor.ch;
		
		let lines = note.split('\n');
		lines = lines.slice(0, line + 1);
		lines[line] = lines[line].substring(0, ch);
		const noteUntilCursor = lines.join('\n');
		
		if (await this.firstLine() > 0) console.warn(`MathContext : irregular first line`);
		return noteUntilCursor.length;
	}
	
	/**
	 * @abstract Queries a text line.
	 */
	async getLine(no: number) : Promise<string> {
		const line = await this.execute('getLine', no);
		console.debug(`Line from Editor : ${line} `);
		
		return line;
	}

	/**
	 * @abstract Queries the line count.
	 */
	async lineCount() : Promise<number> {
		return await this.execute('lineCount');
	}
	
	/**
	 * @abstract Queries the first line.
	 */
	async firstLine() : Promise<number> {
		return await this.execute('firstLine');
	}

	/**
	 * @abstract Queries the last line.
	 */
	async lastLine() : Promise<number> {
		return await this.execute('lastLine');
	}
	
	/**
	 * @abstract Queries the cursor in form of a { line, ch } object.
	 */
	async getCursor() : Promise<any> {
		return await this.execute('getCursor', 'to');
	}

	/**
	 * @abstract Queries the complete note text.
	 */
	async getValue() : Promise<string> {
		return await this.execute('getValue');
	}
	
	/**
	 * @abstract Executes an editor command.
	 */
	async execute(cmd: string, ...args: any) : Promise<any> {
		return await joplin.commands.execute('editor.execCommand', {
			name: cmd,
			args: args
		});
	}
}