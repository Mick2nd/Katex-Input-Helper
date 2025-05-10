import { defineConfig } from 'vite';
import path from 'path';


export default () => defineConfig({
  test: {
    globals: true, 							// oder andere Optionen, falls nötig
    environment: 'jsdom'					// oder ein anderer Environment
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/assets')		// baseURL?
    },
  }
});
