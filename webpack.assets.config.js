import path from 'path';
import webpack from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import HtmlWebpackPlugin from 'html-webpack-plugin';

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
			/*
			splitChunks: {
				chunks: 'async',
				minSize: 20000,
				minRemainingSize: 0,
				minChunks: 1,
				maxAsyncRequests: 30,
				maxInitialRequests: 30,
				enforceSizeThreshold: 50000,
				cacheGroups: {
					commons: {
						name: 'commons',
						chunks: 'async',
						minChunks: 2,
					},
					vendors: {
						test: /[\\/]node_modules[\\/]/,
						priority: -10,
				  		reuseExistingChunk: true,
						filename: 'js/vendors/[name].js',			// no action
						chunks: 'async',
					},
					easyui: {
						test: /src[\\/]assets[\\/]js[\\/]jquery-easyui/,
						priority: -15,
						filename: 'js/easyui/[name].js',			// no action
						chunks: 'all',
					},
					default: {
						minChunks: 2,
				  		priority: -20,
				  		reuseExistingChunk: true,
					},
				},
			}*/
		},
		cache: false,
		context: path.resolve(path.dirname('.'), '.'),
		resolve: {
			alias: {
		    	'@images': path.resolve(path.dirname('.'), 'dist/assets/images/'),
		     	'@fonts': path.resolve(path.dirname('.'), 'fonts/')
			},
		},
		plugins: [
			
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
		],
		entry: [
			'./src/assets/js/bootLoader.js',
		],
		output: {
			clean: true,
			filename: '[name].js',
			chunkFilename: (pathData) => {
				return pathData.chunk.name === 'main' ? '[name].js' : 'js/[name].js';
			},
			path: path.resolve(path.dirname('.'), 'dist/assets'),
			assetModuleFilename: 'misc/[name]-[hash][ext]',
			publicPath: PUBLIC_PATH,
		},
		mode: MODE,
		target: 'web',
		module: {
			rules: [
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
				},				
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
				*/
				{
					test: /^.*?(\.gif|[\\\/]mini_add\.png|i18n[\\\/]icons[\\\/][a-z][a-z]\.png)$/,
					type: 'asset/resource',
					generator: {
						filename: 'icons/[name][ext]'
					}
				},
				{
					test: /\.(woff|woff2|eot|ttf|otf)$/i,
					type: 'asset/resource',
					generator: {
						filename: 'fonts/[name][ext]'
					}
				},
			],
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