
/**
 * Determines the display mode as an extension of the code mirror editor 6.
 * Uses a regular expression search.
 * ATTENTION: the **s** flag is essential and only with ES2016 available.
 */
function displayMode(cm : any) : any {
	
	try {
		cm.defineExtension('displayMode', function() : boolean | undefined {
			console.debug(`Code Mirror %O`, cm);
			const state = cm.cm6.viewState.state;
			const note = state.doc.toString();										// the whole note text
			const cursorIndex = state.selection.ranges[0].to;						// the cursor index inside the text
			const re = /(?<![\\$])((\$\$)|\$)([^{].*?)(\1)/msg;						// regex searches for math sections (block or inline)
			for (let match of note.matchAll(re)) {									// through all matches
				
				const sign = match[1];
				const enclosed = match[3];
				// Reserved.
				// console.debug(`parse2 found : ${sign} ${enclosed} ${match[3]} `);
				// console.debug(`parse2 (whole match) : %O `, match);
				
				const start = match.index;
				const end = start + match[0].length - 1;
				// Reserved.
				// console.debug(`parse2 from ${start} to ${end}`);
				
				if (start <= cursorIndex && cursorIndex <= end) {					// is cursor inside match
					if (sign === '$$') return true;
					else return false;
				}
			}

			throw new Error('Cursor not in Math');
		});
		
		cm.defineExtension('isCm6', function() : boolean {
			return cm.cm6 !== undefined;
		});
		
	} catch(e) {
		
		console.warn(`displayMode could not be acquired : ${e}`);
	}
}


module.exports = 
{
	default: function(context: any) : any 
	{
		return {
			plugin: displayMode,
			codeMirrorResources: [ ],
			codeMirrorOptions: { },			
			assets: function() : any {
				return [
				];
			},
		};
	}
}