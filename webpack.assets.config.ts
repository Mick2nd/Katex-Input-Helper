import path from 'node:path';
import merge from 'webpack-merge';

import devServerConfig from './src/assets/config/devServer';
import pluginsConfig from './src/assets/config/plugins';
import optimizationConfig from './src/assets/config/optimization';
import inputOutputConfig from './src/assets/config/input-output';
import rulesConfig from './src/assets/config/rules';
import { copyVersion } from './src/assets/config/utilities';

//import TerserPlugin from 'terser-webpack-plugin';
//import generate from 'generate-file-webpack-plugin'; // RESERVED
//import test from 'node:test';

const rootDir = path.resolve(path.dirname('.'));
const srcDir = path.resolve(rootDir, 'src');

/**
 * Copies the version to runtime code.
 */
copyVersion();


/**
 * Exported config as used by Webpack
 */
export default function webpackConfig (env: { kihmode: any; }) { 
	const MODE = (env.kihmode ? env.kihmode : "development");
	
	return merge(
		devServerConfig(env),
		pluginsConfig(env),
		optimizationConfig(env),
		inputOutputConfig(env),
		rulesConfig(env),
		{
		cache: false,
		context: path.resolve(rootDir, '.'),
		resolve: {
			alias: {
				'@components': path.resolve(srcDir, 'assets/js'),
			},
			extensions: [".mts", ".ts", ".tsx", ".mjs", ".js", "jsx"],
			extensionAlias: {
			 ".js": [".js", ".ts"],
			 //".cjs": [".cjs", ".cts"],
			 ".mjs": [".mjs", ".mts"]
			}
		},
		mode: MODE,
		target: 'web',
		module: {
			parser: {
				javascript: {
				  // Set the module to `'strict'` or `'non-strict'` mode. This can affect the module's behavior, as some behaviors differ between strict and non-strict modes.
				  overrideStrict: 'non-strict',
				},			
			}
		},
		stats: {
		  loggingDebug: ["sass-loader"],
		},
		node: {
			__filename: true
		}
	},
	{
		mode: MODE
	});
}
