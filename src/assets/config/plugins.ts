import path from 'node:path';
import webpack from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CompressionPlugin from 'compression-webpack-plugin';
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import UnusedWebpackPlugin from 'unused-webpack-plugin';
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
	return {
		optimization: {
			minimizer: [
				// For webpack@5 you can use the `...` syntax to extend existing minimizers
				`...`,
				new CssMinimizerPlugin(),
			],
			minimize: true,
		},
		plugins: getPluginsConfig(env),
	};
} 

/**
 * Extracted Plugins Config
 */
const getPluginsConfig = (env: any) => {
	const ZIP = env.zip ? env.zip : false;
	const base = [
		new UnusedWebpackPlugin({
			directories: [ srcDir ]
		}),
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
		/* NO ACTION resp. ERRORS
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
	];
	
	if (ZIP) return [
		...base,
		new CompressionPlugin({
			test: /\.js$|\.css$/,
			deleteOriginalAssets: true
		})
	];
	
	return base;
}
