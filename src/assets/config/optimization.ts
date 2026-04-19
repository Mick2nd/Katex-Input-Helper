
/**
 * Optimization configuration object as function.
 */
export default function optimizationConfig(env: any) : any {
	return {
		optimization: {
			// TODO: ATTENTION! named works, natural not. But names maybe too long
			// Solved: name easyloader and move it to easyui folder
			// chunkIds: 'natural',
			splitChunks: splitChunksConfig(env),
		},
	};
} 


/**
 * Extracted Split Chunks Config. This only works with async code.
 */
const splitChunksConfig = (_env: any) => { return {
	chunks: 'async', 
	minSize: 20000,
	minRemainingSize: 0,
	minChunks: 1,
	maxAsyncRequests: 30,
	maxInitialRequests: 30,
	enforceSizeThreshold: 50000,

	cacheGroups: {
		vendors: {
			/**
			 * Experience with 'all':
			 * - more chunks are factored out
			 * - but application stops
			 * - why is the code not async ?
			 */
			test: /[\\/](node_modules)[\\/]/,
			priority: -10,
	  		reuseExistingChunk: true,
			filename: 'js/vendors/[name].js',
			chunks: 'async',
		},
		
		/** 
		 *	TODO: experiments. Have been of little use.
		 *
		categories: {
			test: /[\\/]src[\\/]assets[\\/]js[\\/]categoriesTree\.mjs$/,
			reuseExistingChunk: true,
			name: 'categoriesTree',
			chunks: 'initial',
			enforce: true
		},
		internals: {
			test: /[\\/]src[\\/]assets[\\/]js[\\/]/,
			priority: -10,
			reuseExistingChunk: true,
			filename: 'js/internals/[name].js',
			chunks(chunk: any) {
				if (chunk && chunk.name) {
					console.log(`Internal Chunkname is ${chunk.name}`);
				} 
				return false; // chunk && chunk.name && chunk.name == 'categoriesTree'; 
			},
		},
		default: {
		  minChunks: 2,
		  priority: -20,
		  reuseExistingChunk: true,
		  chunks: 'all'
		}
		*/
	},
}};
