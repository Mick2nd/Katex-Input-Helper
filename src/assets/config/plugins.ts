import path from 'node:path';
import webpack from 'webpack';
import merge from 'webpack-merge';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CompressionPlugin from 'compression-webpack-plugin';
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import UnusedWebpackPlugin from 'unused-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
//import glob from 'glob';
//import { PurgeCSSPlugin, UserDefinedOptions } from "purgecss-webpack-plugin";

const rootDir = path.resolve(path.dirname('.'));
const srcDir = path.resolve(rootDir, 'src', 'assets', 'js');
const PATHS = {
	src: path.resolve(path.dirname('.'), 'src/assets/js'),
};

/**
 * Plugins config object as function.
 */
export default function pluginsConfig(env: any) : any {
	return merge({
		optimization: {
			minimizer: [
				// For webpack@5 you can use the `...` syntax to extend existing minimizers
				`...`,
				new CssMinimizerPlugin(),
			],
			minimize: true,
		},
		plugins: [
			new webpack.ProvidePlugin({
				$: 'jquery',
				jQuery: 'jquery',
			}),
			// DEFINES GLOBAL VARIABLES, but babel-loader must not be active
			new webpack.DefinePlugin({
				KIH_VERSION: JSON.stringify('7.44'),
				PRODUCTION: JSON.stringify(env.kihmode ? (env.kihmode == 'production') : false),
				EASYUI_INCLUDES: JSON.stringify(includeList)
			}),
			new MiniCssExtractPlugin({ 
				filename: '[name].css',
				chunkFilename: 'css/[name].styles.css' //	=> works, but name is essential
			}),
			new CopyPlugin({
				patterns: [
					{ from: 'src/assets/start.html', to: 'start.html' },
					{ from: 'src/assets/favicon.ico', to: 'favicon.ico' },
					{ from: 'src/assets/js/jquery-easyui/datagrid-cellediting.js', to: 'js/easyui', toType: 'dir', filter: filter },
					{ from: 'src/assets/js/jquery-easyui/datagrid-dnd.js', to: 'js/easyui', toType: 'dir', filter: filter },
					{ from: 'src/assets/js/jquery-easyui/datagrid-filter.js', to: 'js/easyui', toType: 'dir', filter: filter },
					{ from: 'src/assets/js/jquery-easyui/plugins', to: 'js/easyui/plugins', toType: 'dir', filter: filter },
					{ from: 'src/assets/js/jquery-easyui/themes/default', to: 'js/easyui/themes/default', toType: 'dir', filter: filter },
				],
			}),
			new HtmlWebpackPlugin({
				title: 'My Webpack App',
				template: './src/assets/start.html',
				filename: './index.html',
			}),
			
			/**
			 * From the documentation: the Terser plugin is active anyway, but only 
			 * for production mode.
			 */
			//new TerserPlugin(),
			
			/** 
			 * NO ACTION resp. ERRORS
			 * categoriesTree is truncated.
			 * as a result that module cannot be loaded.
			 * 
			new webpack.IgnorePlugin({
				resourceRegExp: /\/post-load\//,
				//contextRegExp: /jquery-easyui/,
			}),		
			*/
			
			/* First Impression: it works, but
			 * - how
			 * - difficult to apply
			 */
			//new PurgeCSSPlugin({
			//	paths: glob.sync(`${PATHS.src}/**/*.?[tj]s`, { nodir: true }),
			//	safelist: [/^.*$/],
			//	blocklist: [/^body\.katex-desktop/]
			//} as UserDefinedOptions),
		],
	},
	getDiagnosisConfig(env),
	getZipConfig(env));
} 

/**
 * Returns diagnostic plugins in the case of the 'development' mode, otherwise
 * nothing.
 */
function getDiagnosisConfig(env: any) : any {
	const MODE = (env.kihmode ? env.kihmode : "development");
	if (MODE == 'development') {
		return {
			plugins: [
				/**
				 * This plugin provides unused (unreferenced) files, but they are not
				 * included in the output anyway.
				 */
				new UnusedWebpackPlugin({
					directories: [ srcDir ]
				}),
				
				/**
				 */
				new BundleAnalyzerPlugin({
				  analyzerMode: 'static',
				  reportFilename: 'bundle-report.html',
				  openAnalyzer: false,
				  generateStatsFile: true,
				  statsFilename: 'stats.json'
				}),
			]
		};
	}
	
	return { };
}

/**
 * Returns the Compression Plugin in the case of 'zip' environment variable,
 * otherwise nothing.
 */
function getZipConfig(env: any) : any {
	const ZIP = env.zip ? env.zip : false;
	if (ZIP) {
		return {
			plugins: [
				new CompressionPlugin({
					test: /\.m?js$|\.css$/,
					deleteOriginalAssets: true
				})
			]			
		};
	}
	return { };
}

/**
 * This is the include list for the Copy Plugin. It defines the PLUGINs for the
 * easyloader.
 */
const includeList = [
	'accordion',
	'combo',
	'combobox',
	
	'datagrid',
	'treegrid',
	'combogrid',
	
	'dialog',
	'draggable',
	'droppable',
	'flex',
	'layout',
	'linkbutton',
	'menu',
	'menubutton',
	'messager',
	'mobile',
	'pagination',
	'panel',
	'parser',
	'progressbar',
	'radiobutton',
	'radiogroup',
	'resizable',
	'sidemenu',
	'tabs',
	'textbox',
	'tooltip',
	'tree',
	'validatebox',
	'window',
	'blank',
	
	'datagrid-cellediting',
	'datagrid-dnd',
	'datagrid-filter',
];

/**
 * Filter function for the CopyPlugin. It filters out not needed EASYUI plugins.
 */
function filter(filepath: string) : boolean {
	
	let file = path.basename(filepath);
	const extpos = file.lastIndexOf('.');
	file = file.substring(0, extpos);
	if (file.startsWith('jquery.')) {
		file = file.substring(7);
	}
	return includeList.includes(file);
}
