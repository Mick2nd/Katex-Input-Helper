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
const splitChunksConfig = {
	chunks: 'async',
	minSize: 20000,
	minRemainingSize: 0,
	minChunks: 1,
	maxAsyncRequests: 30,
	maxInitialRequests: 30,
	enforceSizeThreshold: 50000,

	cacheGroups: {
		/* NO IDEA WHAT THE PURPOSE IS
		   A configuration sample?
		   Creates a 1 MB large commons script, seems to have precedence over vendors. 
		
		commons: {
			name: 'commons',
			chunks: 'async',
			minChunks: 2,
		},
		*/
		/*	NO ACTION like easyui
		i18n: {
			test: /[\\/]i18n[\\/]/,
			priority: -10,
			reuseExistingChunk: true,
			filename: 'js/i18n/[name].js',
			chunks: 'async',
		},
		*/
		
		vendors: {
			test: /[\\/](node_modules)[\\/]/,
			priority: -10,
	  		reuseExistingChunk: true,
			filename: 'js/vendors/[name].js',
			chunks: 'async',
		},
		
		/*	ACTION: API only copied, generates extra entry in index.html
			This is deactivated, if async chunks are selected
			
		easyui: {
			test: /src[\\/]assets[\\/]js[\\/]jquery-easyui/,
			priority: -15,
			filename: 'js/easyui/[name].js',			// no action
			chunks: 'async',
		},
		*/
		/* NO IDEA WHAT THE PURPOSE IS
		   A configuration sample?
		
		default: {
			minChunks: 2,
	  		priority: -20,
	  		reuseExistingChunk: true,
		},
		*/
	},
};

/**
 * Extracted Rules Config
 */
const rulesConfig = [
	/*	NO DISADVANTAGE TO DEACTIVATE BABEL
	{
		test: /\.js$/,
		include: [ path.resolve(path.dirname('.'), 'src/assets/js') ],
		exclude: [ path.resolve(path.dirname('.'), '.'), /node_modules/ ],
		loader: 'babel-loader',
		options: {
		   	presets:  [
		    	['@babel/preset-env']
		   	],
		}
	},*/				
	{
		test: /\.css$/,
		include: [ path.resolve(path.dirname('.'), 'src/assets/js') ],
		exclude: [ /node_modules/ ],
		use: [ MiniCssExtractPlugin.loader, 'css-loader' ],
		sideEffects: true
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
const pluginsConfig = [
	/*	THERE CAN BE SEEN NO EFFECT ON GENERATED JS
		Also with deactivated Babel		
	new webpack.optimize.ModuleConcatenationPlugin(),
	*/
	
	/*	Limits effectively the number of chunks, but then themes are no longer
		working
	new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 20 }),
	*/
	new webpack.ProvidePlugin({
		$: 'jquery',
		jQuery: 'jquery',
	}),
	// DEFINES GLOBAL VARIABLES, but babel-loader must not be active
	new webpack.DefinePlugin({
		KIH_VERSION: JSON.stringify('7.44')
	}),
	new TerserPlugin(),
	new MiniCssExtractPlugin({ 
		filename: '[name].css',
		chunkFilename: 'css/[name].styles.css' //	=> works, but name is essential
	}),
	new CopyPlugin({
		patterns: [
			{ from: 'src/assets/dialog.html', to: 'dialog.html' },
			{ from: 'src/assets/doc', to: 'doc' },
			{ from: 'src/assets/formulas', to: 'formulas' },
			{ from: 'src/assets/information', to: 'information' },
		],
	}),
	new HtmlWebpackPlugin({
		title: 'My Webpack App',
		template: './src/assets/dialog.html',
		filename: './index.html',
	})
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
			splitChunks: splitChunksConfig
		},
		cache: false,
		context: path.resolve(path.dirname('.'), '.'),
		resolve: {
			alias: {
		    	'@images': path.resolve(path.dirname('.'), 'dist/assets/images/'),
		     	'@fonts': path.resolve(path.dirname('.'), 'fonts/')
			},
		},
		plugins: pluginsConfig,
		entry: [
			'./src/assets/js/bootLoader.js',
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
			rules: rulesConfig,
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
	writeJson(versionPath, versions);
}