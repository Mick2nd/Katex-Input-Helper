import path from 'node:path';
import fs from 'fs-extra';
import webpack from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CompressionPlugin from 'compression-webpack-plugin';
import * as sass from 'sass';
import Handlebars from 'handlebars';
import generate from 'generate-file-webpack-plugin';

const rootDir = path.resolve(path.dirname('.'));
const srcDir = path.resolve(rootDir, 'src');
const manifestPath = path.resolve(srcDir, 'manifest.json');
const versionPath = path.resolve(srcDir, 'assets', 'js', 'versions.json');

/**
 * Copies the version to runtime code.
 */
copyVersion();

/**
 * Extracted Split Chunks Config
 */
const splitChunksConfig = (env) => { return {
	chunks: 'async',
	minSize: 20000,
	minRemainingSize: 0,
	minChunks: 1,
	maxAsyncRequests: 30,
	maxInitialRequests: 30,
	enforceSizeThreshold: 50000,

	cacheGroups: {
		vendors: {
			test: /[\\/](node_modules)[\\/]/,
			priority: -10,
	  		reuseExistingChunk: true,
			filename: 'js/vendors/[name].js',
			chunks: 'async',
		},
	},
}};

/**
 * Extracted Rules Config
 */
const rulesConfig = (env) => [
	{
		test: /\.tsx?$/,
		exclude: /node_modules/,
		use: [{
			loader: 'ts-loader',
			options: {
				configFile: 'src/assets/tsconfig.json'
			}
		}]
	},
	{
		test: /\.s?css$/,
		include: [ path.resolve(path.dirname('.'), 'src/assets/js') ],
		exclude: [ /node_modules/, /stylesheets/ ],
		use: [
			MiniCssExtractPlugin.loader, 
			'css-loader', 
			{
				loader: 'sass-loader', 
				options: {
				    sourceMap: true,
				    implementation: sass,
				    sassOptions: {
						minimize: false,
				    	outputStyle: 'expanded',
				    },
				},
			}
		],
		sideEffects: true
	},
	// TEST: handlebars as preprocessor
	{
		test: /dialog.*\.hbs$/i,
		exclude: /(node_modules)|(html)/,
		use: [
			{
			loader: 'html-loader',
			options: {
				preprocessor: preProcess({ mobile: false })
			}
		}]
	},
	/* WE USE COPY PLUGIN ... this generates additional JS file: start_html.js
	 */
	{
		test: /\.html$/i,
		exclude: [/node_modules/],
		use: [{
			loader: 'raw-loader',
		}]
	},
	{
		test: /\.(pdf|jpg|png|svg|ico)$/,
		type: 'asset/resource',
		generator: {
			filename: 'images/[name]-[hash][ext]'
		}
	},
	/*
	- images without hash as they are used by me
	- country flags, gifs, certain other icon
	*/
	{
		test: /^.*?(\.gif|[\\\/]mini_add\.png|i18n[\\\/]icons[\\\/][a-z][a-z]\.png)$/,
		type: 'asset/resource',
		generator: {
			filename: 'icons/[name][ext]',
		}
	},
	{
		test: /\.(woff|woff2|eot|ttf|otf)$/i,
		type: 'asset/resource',
		generator: {
			filename: 'fonts/[name][ext]'
		}
	},
];

/**
 * Extracted Plugins Config
 */
const pluginsConfig = (env) => {
	const ZIP = env.zip ? env.zip : false;
	const base = [
		new webpack.ProvidePlugin({
			$: 'jquery',
			jQuery: 'jquery',
		}),
		// DEFINES GLOBAL VARIABLES, but babel-loader must not be active
		new webpack.DefinePlugin({
			KIH_VERSION: JSON.stringify('7.44'),
			PRODUCTION: JSON.stringify(env.kihmode ? (env.kihmode == 'production') : false)
		}),
		//new TerserPlugin(),
		new MiniCssExtractPlugin({ 
			filename: '[name].css',
			chunkFilename: 'css/[name].styles.css' //	=> works, but name is essential
		}),
		new CopyPlugin({
			patterns: [
				{ from: 'src/assets/start.html', to: 'start.html' },
				{ from: 'src/assets/favicon.ico', to: 'favicon.ico' },
			],
		}),
		new HtmlWebpackPlugin({
			title: 'My Webpack App',
			template: './src/assets/start.html',
			filename: './index.html',
		}),
		/* RESERVED for future use.
		generate({
		    file: path.resolve(rootDir, 'dist', 'assets', 'dialog_generated_desktop.html'),
		    content: () => {
		        return preProcessFile('src/assets/dialog.hbs', { mobile: false });
		    },
			debug: true
		})
		*/
	];
	
	if (ZIP) return base.concat([
		new CompressionPlugin({
			test: /\.js$|\.css$/,
			deleteOriginalAssets: true
		})
	]);
	return base;
}

/**
 * Provides settings for the dev server.
 */
const devServerConfig = (env) => {
	const ZIP = env.zip ? env.zip : false;
	const rewrites = [		
		{ from: /^(.*)\.css$/, to: function(context) { return context.parsedUrl.pathname + '.gz'; } },
		{ from: /^(.*)\.js$/, to: function(context) { return context.parsedUrl.pathname + '.gz'; } },
		{ from: /.*/, to: function(context) { return context.parsedUrl.pathname; } }
	];
	const headers = (context) => {
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
			directory: path.resolve(path.dirname('.'), 'dist/assets'),
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

/**
 * Exported config as used by Webpack
 */
export default (env) => { 
	const PUBLIC_PATH = (env.ghpages ? "/Katex-Input-Helper/" : "auto");
	const MODE = (env.kihmode ? env.kihmode : "development");
	const ZIP = (env.zip ? env.zip : false);
	
	return {
		optimization: {
			minimizer: [
		    // For webpack@5 you can use the `...` syntax to extend existing minimizers
		    	`...`,
		    	new CssMinimizerPlugin(),
			],
			minimize: true,
			/**/
			splitChunks: splitChunksConfig(env)
		},
		cache: false,
		context: path.resolve(path.dirname('.'), '.'),
		resolve: {
			alias: {
		    	'@images': path.resolve(path.dirname('.'), 'dist/assets/images/'),
		     	'@fonts': path.resolve(path.dirname('.'), 'fonts/'),
			},
			extensions: [".ts", ".tsx", ".js"]
		},
		plugins: pluginsConfig(env),
		entry: {
			main: './src/assets/js/container.ts',
			//test: './src/assets/dialog-test.hbs'
		},
		output: {
			clean: true,
			filename: '[name].js',
			chunkFilename: 
			/*	BELIEVE, this is more or less for different entries
				Sample code not working. 
				'js/[name].js',
			*/
			(pathData) => {
				let name = pathData.chunk.name;
				if (!name) { name = pathData.chunk.id; }
				
				if (typeof name !== 'string') {
					return 'js/[name].js';
				}
				if (name.includes('i18n')) {
					return 'js/i18n/[name].js';
				}
				if (name.includes('codemirror')) {
					return 'js/vendors/[name].js';
				}
				if (name.includes('easyui')) {
					return 'js/easyui/[name].js';
				}
				if (name.includes('localization')) {
					return 'js/localization/[name].js';
				}
				return 'js/[name].js';
			},
			path: path.resolve(path.dirname('.'), 'dist/assets'),
			assetModuleFilename: 'misc/[name]-[hash][ext]',
			publicPath: PUBLIC_PATH,
		},
		mode: MODE,
		target: 'web',
		module: {
			rules: rulesConfig(env),
			parser: {
				javascript: {
				  // Set the module to `'strict'` or `'non-strict'` mode. This can affect the module's behavior, as some behaviors differ between strict and non-strict modes.
				  overrideStrict: 'non-strict',
				},			
			}
		},
		devServer: devServerConfig(env),
		stats: {
		  loggingDebug: ["sass-loader"],
		},
	};
}

/**
 * Preprocesses a handlebars file as required by html-loader.
 */
function preProcess(context = { }) {
	function registerPartial(name) {
		const dir = path.resolve(srcDir, 'assets', 'views');
		const file = path.resolve(dir, `${name}.partial`);
		const text = fs.readFileSync(file).toString();
		Handlebars.registerPartial(name.replace('+', ''), text);
	}

	return async function(content, loaderContext) {
		let result;
		try {
			console.log(`About to compile handlebars content`);
			const names = [ 
				'windows', 'head', 'accordion-west', 'accordion-east', 'menu-desktop', 'menu-mobile', 'wait+form' 
			];
			for (const name of names) {
				registerPartial(name);
			}
			result = Handlebars.compile(content)(context);
		} catch(error) {
			await loaderContext.emitError(error);
			return content;
		}
		return result;
	}
}

function preProcessFile(file, context) {
	let text;
	try {
		text = fs.readFileSync(path.resolve(path.dirname('.'), file)).toString();
		text = Handlebars.compile(text)(context);
	} catch(error) {
		console.error(`Handlerbars file could not be compiled : ${error}`);
		return text;
	}
	return text;
}

/**
 * Reads a JSON file from file system and returns the JSON object.
 */
function readJson(jsonPath) {	
	const json = fs.readFileSync(jsonPath, 'utf8');
	const content = JSON.parse(json);
	
	return content;
}

/**
 * Writes a JSON file to file system given the JSON object.
 */
function writeJson(jsonPath, content) {
	const json = JSON.stringify(content, null, '\t');
	fs.writeFileSync(jsonPath, json, 'utf8');	
}

/**
 * Copies the version entry from Manifest to runtime versions.json file.
 * The *versions.json* file contains all versions of components not directly available.
 */
function copyVersion() {
	const manifest = readJson(manifestPath);
	const version = manifest.version;
	const versions = readJson(versionPath);
	versions.version = version;
	versions.build ++;
	writeJson(versionPath, versions);
}