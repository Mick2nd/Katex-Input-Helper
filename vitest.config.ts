/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import inject from '@rollup/plugin-inject';
import path from 'path';

export default defineConfig(() => { 
	return {
		test: {
			globals: true,
	  		environment: 'jsdom',
			chaiConfig: {
				includeStack: true
			},
			poolOptions: {
				forks: {
					execArgv: ['--no-warnings']
				}
			}
		},
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src/assets'),
				'~': path.resolve(__dirname, '/node_modules'),
	  		},
		},
		plugins: [
			inject({
			    $: 'jquery',
			    jQuery: 'jquery',
				//panel: ['@/js/jquery-easyui/jquery.easyui.min', 'panel']	// NO ACTION on this
			}),
		],
	};
});
