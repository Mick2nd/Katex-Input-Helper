import path from 'node:path';

// TODO: ATTENTION! What is . here?
const rootDir = path.resolve(path.dirname('.'));

/**
 * Provides settings for the dev server.
 */
export default function devServerConfig(env: any) : any { 
	return { 
		devServer: getDevServerConfig(env)
	}
}

/**
 * Function returning the configuration object, webpack compatible.
 */
function getDevServerConfig(env: any) : any {
	const ZIP = env.zip ? env.zip : false;
	const rewrites = [		
		{ 
			from: /^(.*)\.css$/, 
			to: function(context: any) { return context.parsedUrl.pathname + '.gz'; } 
		},
		{ 
			from: /^(.*)\.js$/, 
			to: function(context: any) { return context.parsedUrl.pathname + '.gz'; } 
		},
		{ 
			from: /.*/, 
			to: function(context: any) { return context.parsedUrl.pathname; } 
		}
	];
	const headers = (context: any) => {
		console.log(`Headers request : %O`, context);
		if (context.url.endsWith('.js')) {
			console.log(`Headers request : ${context.url}`);
			return {
				"Content-Encoding" : "gzip",
				"Accept-Encoding" : "gzip",
				"Transfer-Encoding" : "chunked",
				"Content-Type": "application/javascript; charset=utf-8",
			};
		}
		if (context.url.endsWith('.css')) {
			console.log(`Headers request : ${context.url}`);
			return {
				"Content-Encoding" : "gzip",
				"Transfer-Encoding" : "chunked",
				"Content-Type": "text/css; charset=utf-8",
				"vary": "Accept-Encoding"
			};
		}
		if (context.url.endsWith('.json')) {
			console.log(`Headers request : ${context.url}`);
			return {
				"Content-Encoding" : "identity",
				"Content-Type": "text/json; charset=utf-8",
			};
		}
		return {
			
		};
	};

	const base = {						// base settings for the dev server
		static: {
			directory: path.resolve(rootDir, 'dist/assets'),
		},
	  	compress: !ZIP,
	  	port: 9000,
		allowedHosts: 'all',
	};

	const zip = {						// additional settings for the ZIP case
		headers: headers,
		historyApiFallback: {
			rewrites: rewrites,
			verbose: true
		},
	};

	if (ZIP) return { ...base, ...zip };
	return base;
}
