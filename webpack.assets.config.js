import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyPlugin from 'copy-webpack-plugin';

export default () => { 
	return {
		context: path.resolve(path.dirname('.'), '.'),
		resolve: {
			alias: {
		    	'@images': path.resolve(path.dirname('.'), 'images/'),
		     	'@fonts': path.resolve(path.dirname('.'), 'fonts/')
			},
		},
		plugins: [
			new TerserPlugin(),
			new MiniCssExtractPlugin({ filename: 'styles.css' }),
			new CopyPlugin({
				patterns: [
					{ from: 'src/assets/dialog.html', to: 'dialog.html' },
					{ from: 'src/assets/dialog2.html', to: 'dialog2.html' },
					{ from: 'src/assets/doc', to: 'doc' },
					{ from: 'src/assets/formulas', to: 'formulas' },
					{ from: 'src/assets/information', to: 'information' },
					{ from: 'src/assets/js/jquery-easyui', to: 'js/jquery-easyui' },
					{ from: 'src/assets/js/jquery-easyui-MathEditorExtend', to: 'js/jquery-easyuiMathEditorExtend' },
					{ from: 'src/assets/js/localization', to: 'js/localization' },
				]
			})
		],
		entry: [
			'./src/assets/js/bootLoader.js',
		],
		output: {
			clean: true,
			filename: 'bundle.js',
			path: path.resolve(path.dirname('.'), 'dist/assets'),
			assetModuleFilename: 'misc/[name][ext]',
		},
		mode: 'development',
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
				/*
				- copy operation works
				- images appear doubled
				- no icons in app
				{
					test: /\.(pdf|jpg|png|gif|svg|ico)$/,
					loader: 'file-loader',
					options: { name: 'images/[name].[ext]' }
				}*/
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