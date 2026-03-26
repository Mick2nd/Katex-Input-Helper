
/**
 * @abstract Determines the display mode.
 * 
 * Uses a regular expression search.
 */
function displayMode(cm : any) : any {
	
	try {
		cm.defineExtension('displayMode', function() : boolean | undefined {
			console.debug(`Code Mirror %O`, cm);
			const state = cm.cm6.viewState.state;
			const note = state.doc.toString();										// the whole note text
			const cursorIndex = state.selection.ranges[0].to;						// the cursor index inside the text
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