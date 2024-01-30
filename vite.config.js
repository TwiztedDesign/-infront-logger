import { defineConfig } from 'vite';
import { resolve } from 'path'

export default defineConfig({
	build: {
		minify : false,
		lib: {
			entry: resolve(__dirname, 'lib/main.js'),
			name: 'logger',
			fileName: (format) => `logger.${format}.js`
		}
	}
});
