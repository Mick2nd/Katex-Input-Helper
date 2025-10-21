import path from 'path';
import fs from 'fs-extra';
import webpack from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import HtmlWebpackPlugin from 'html-webpack-plugin';

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
		exclude: [ /node_modules/ ],
		use: [ MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader' ],
		sideEffects: true
	},
	{
		test: /\.html$/i,
		exclude: /node_modules/,
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
const pluginsConfig = (env) => [
	new webpack.ProvidePlugin({
		$: 'jquery',
		jQuery: 'jquery',
	}),
	// DEFINES GLOBAL VARIABLES, but babel-loader must not be active
	new webpack.DefinePlugin({
		KIH_VERSION: JSON.stringify('7.44'),
		PRODUCTION: JSON.stringify(env.kihmode ? (env.kihmode == 'production') : false)
	}),
	new TerserPlugin(),
	new MiniCssExtractPlugin({ 
		filename: '[name].css',
		chunkFilename: 'css/[name].styles.css' //	=> works, but name is essential
	}),
	new CopyPlugin({
		patterns: [
			{ from: 'src/assets/dialog.html', to: 'dialog.html' },
			{ from: 'src/assets/dialog-mobile.html', to: 'dialog-mobile.html' },
		],
	}),
	new HtmlWebpackPlugin({
		title: 'My Webpack App',
		template: './src/assets/dialog.html',
		filename: './index.html',
	}),
	new HtmlWebpackPlugin({
		title: 'My Webpack App',
		template: './src/assets/dialog-mobile.html',
		filename: './index-mobile.html',
	}),
];

/**
 * Exported config as used by Webpack
 */
export default (env) => { 
	const PUBLIC_PATH = (env.ghpages ? "/Katex-Input-Helper/" : "auto");
	const MODE = (env.kihmode ? env.kihmode : "development");
	
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
		entry: [
			'./src/assets/js/container.ts',
		],
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
		devServer: {
			static: {
				directory: path.resolve(path.dirname('.'), 'dist/assets'),
			},
		  	compress: true,
		  	port: 9000,
			allowedHosts: 'all',
		},
		stats: {
		  loggingDebug: ["sass-loader"],
		},
	};
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
 * Copies the version entry from Manifest to to runtime versions.json file.
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