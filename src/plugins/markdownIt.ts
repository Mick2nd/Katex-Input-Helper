

module.exports = 
{
	default: function(context: any) : any 
	{
		const pluginId = context.pluginId;
		console.info(`${pluginId} : Here in Plugin default (OUTER) function`);
		
		/**
		 *	@abstract Catches Math blocks.
		 */
		function catchMathBlock(originalMathBlockRender: any, ruleOptions: any, tokens: any[], idx: number) : any
		{
			let token = tokens[idx]
			console.debug(`${pluginId} : Invoking Original math_block render function at ${idx} : %O`, token);			
			let result = originalMathBlockRender(tokens, idx);											// original must be invoked first			
			console.info(`${pluginId} : Original math_block render function invoked at ${idx} : %O`, token);

			// TODO: do something with MATH BLOCK
						
			return result;
		}

		/**
		 *	@abstract Catches Math inlines.
		 */
		function catchMathInline(originalMathInlineRender: any, ruleOptions: any, tokens: any[], idx: number) : any
		{
			let token = tokens[idx]
			console.debug(`${pluginId} : Invoking Original math_inline render function at ${idx} : %O`, token);			
			let result = originalMathInlineRender(tokens, idx);											// original must be invoked first			
			console.info(`${pluginId} : Original math_inline render function invoked at ${idx} : %O %O`, token, ruleOptions);

			// TODO: do something with MATH INLINE
						
			return result;
		}
		

		return {
			plugin: async function(markdownIt: any, ruleOptions: any) {
				
				const test = 'test'; // await context.postMessage(`${pluginId}`, 'queryCursorLocation');
				console.info(`${pluginId} : Here in Plugin (INNER) function : ${test} `);
		
				const originalMathBlockRender = markdownIt.renderer.rules.math_block;
				console.info(`${pluginId} : Original math_block renderer stored`);

				markdownIt.renderer.rules.math_block = function(tokens: any[], idx: number) : any {		// replacement for link_open rule 				
					return catchMathBlock(originalMathBlockRender, ruleOptions, tokens, idx);
				};

				
				const originalMathInlineRender = markdownIt.renderer.rules.math_inline;
				console.info(`${pluginId} : Original math_inline renderer stored`);

				markdownIt.renderer.rules.math_inline = function(tokens: any[], idx: number) : any {	// replacement for link_open rule 				
					return catchMathInline(originalMathInlineRender, ruleOptions, tokens, idx);
				};
			},
			
			assets: function() : any {
				return [
				];
			},
		}
	}
}
