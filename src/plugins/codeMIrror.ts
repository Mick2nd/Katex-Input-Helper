
module.exports = 
{
	default: function(context: any, postMessage: any) : any 
	{
		return {
			plugin: async function(codeMirrorProxy: any)
			{	
				console.info(`${context.pluginId} : Here in Plugin (INNER) function`);				
			},
			
			assets: function() : any {
				return [
				];
			},
		};
	}
}