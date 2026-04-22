import path from 'node:path';
import fs from 'fs-extra';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import * as sass from 'sass';
import Handlebars from 'handlebars';

const rootDir = path.resolve(path.dirname('.'));
const srcDir = path.resolve(rootDir, 'src');

/**
 * Rules config object as function.
 */
export default function rulesConfig(env: any) : any {
	return {
		module: {
			rules: [
				{
					test: /\.m?ts$/,
					include: [ path.resolve(rootDir, 'src/assets/js') ],
					exclude: /node_modules/,
					use: [{
						loader: 'ts-loader',
						options: {
							configFile: 'src/assets/tsconfig.json'
						},
					}]
				},
				/**
				 * Try to process 'easyloader' files although they are not dependencies.
				 * DID NOT WORK.
				{
					test: /\.js$/,
					include: [ path.resolve(rootDir, 'src/assets/js/jquery-easyui/plugins') ],
					exclude: /node_modules/,
					use: "js-loader"
				},
				*/
				{
					test: /\.s?css$/,
					include: [ path.resolve(rootDir, 'src/assets/js') ],
					exclude: cssExcludes(),
					use: [
						MiniCssExtractPlugin.loader,
						{
							loader: 'css-loader', 
							options: {
								modules : false
							}
						},
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
					test: /dialog-.*\.hbs$/i,
					exclude: /(node_modules)|(html)/,
					use: [
						{
						loader: 'html-loader',
						options: {
							preprocessor: preProcess({ 
								mobile: false
							})
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
					test: /^.*?(\.gif|[\\/]mini_add\.png|i18n[\\/]icons[\\/][a-z][a-z]\.png)$/,
					type: 'asset/resource',
					generator: {
						filename: 'icons/[name][ext]',
					}
				},
				/* TEST -> with outcommenting fonts move to misc, controlled by 'output'
				 * where ever they are placed by webpack, they are necessary
				 */
				{
					test: /\.(woff|woff2|eot|ttf|otf)$/i,
					type: 'asset/resource',
					generator: {
						filename: 'fonts/[name][ext]'
					}
				},
			],
		}
	};
}

/**
 * Preprocesses a handlebars file as required by html-loader.
 */
function preProcess(context = { }) {
	function registerPartial(name: any) {
		const dir = path.resolve(srcDir, 'assets', 'views');
		const file = path.resolve(dir, `${name}.hbs`);
		const text = fs.readFileSync(file).toString();
		Handlebars.registerPartial(name.replace('+', ''), text);
	}

	return async function(content: any, loaderContext: { emitError: (arg0: any) => any; }) {
		let result: any;
		try {
			console.log(`About to compile handlebars content`);
			const names = [ 
				'windows', 'head', 'accordion-west', 'accordion-east', 
				'menu-desktop', 'menu-mobile', 'wait+form', 'footer', 'toggle',
				'menu-file', 'menu-insert', 'menu-tools', 'menu-view', 'menu-options', 'menu-informations', 'menu-chars'
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

/**
 * Reads a file and preprocesses it with handlebars.
 * RESERVED.
 */
function preProcessFile(file: string, context: any) {
	let text: string = "";
	try {
		text = fs.readFileSync(path.resolve(rootDir, file)).toString();
		text = Handlebars.compile(text)(context);
	} catch(error) {
		console.error(`Handlerbars file could not be compiled : ${error}`);
		return text;
	}
	return text;
}

function cssExcludes() {
	return [
		/node_modules/, 
		/stylesheets/ 
	];
}
