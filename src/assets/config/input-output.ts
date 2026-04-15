import path from 'node:path';
import webpack from 'webpack';

const rootDir = path.resolve(path.dirname('.'));

/**
 * Input/Output configuration object as function.
 */
export default function inputOutputConfig(env: any) : any {
	const PUBLIC_PATH = (env.ghpages ? "/Katex-Input-Helper/" : "auto");
	return {
		entry: {
			main: {
				import: './src/assets/js/container.mts',
				dependOn: ['libs'],
			},
			libs: {
				import: [
					'inversify', 'buffer', 
					'./src/assets/js/interfaces.mts', './src/assets/js/patterns/observable.mts'
				],
			},
		},
		output: {
			clean: true,
			filename: '[name].js',
			chunkFilename: (pathData: webpack.PathData) => { 
				/**
				 * 	Each extra (chunk) component has its own file. We can name them
				 *	according to development version and origin.
				 */
				let name: any = pathData.chunk?.name;
				if (!name) { name = pathData.chunk?.id; }
				
				if (typeof name !== 'string') {
					return 'js/[name].js';
				}
				const ext = getExtension(name);				
				if (ext == 'html' || ext == 'hbs' || ext == 'json') {
					return `${ext}/[name].js`;
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
					return `js/localization/[name].js`;
				}
				return 'js/[name].js';
			},
			path: path.resolve(rootDir, 'dist/assets'),
			assetModuleFilename: 'misc/[name]-[hash][ext]',
			publicPath: PUBLIC_PATH,
		},
	};
}

/**
 * The extension determined here is the original file type.
 * 
 * @param name - the chunk file name
 * @returns the original file type
 */
function getExtension(name: string) {
	const pos = name.lastIndexOf('_');
	return pos >= 0 ? name.substring(pos + 1) : "";
}
