import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'url';
import { resolve } from 'path';

import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
// import rollupNodePolyFill from "rollup-plugin-node-polyfills";
export default defineConfig({

	// plugins : [
	// 	{
	// 		name: "fix-node-globals-polyfill",
	// 		// setup(build) {
	// 		// 	build.onResolve({ filter: /util\.js/ }, ({ path }) => ({ path }));
	// 		// },
	// 	},
	// ],
	resolve : {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
			// util: 'rollup-plugin-node-polyfills/polyfills/util',
			// This Rollup aliases are extracted from @esbuild-plugins/node-modules-polyfill,
			// see https://github.com/remorses/esbuild-plugins/blob/master/node-modules-polyfill/src/polyfills.ts
			// process and buffer are excluded because already managed
			// by node-globals-polyfill
			util: "util",
			// sys: "util",
			// events: "rollup-plugin-node-polyfills/polyfills/events",
			// stream: "rollup-plugin-node-polyfills/polyfills/stream",
			// path: "rollup-plugin-node-polyfills/polyfills/path",
			// querystring: "rollup-plugin-node-polyfills/polyfills/qs",
			// punycode: "rollup-plugin-node-polyfills/polyfills/punycode",
			// url: "rollup-plugin-node-polyfills/polyfills/url",
			// /******** Remove the string decoder below *********/
			// // string_decoder: "rollup-plugin-node-polyfills/polyfills/string-decoder",
			// http: "rollup-plugin-node-polyfills/polyfills/http",
			// https: "rollup-plugin-node-polyfills/polyfills/http",
			// os: "rollup-plugin-node-polyfills/polyfills/os",
			// assert: "rollup-plugin-node-polyfills/polyfills/assert",
			// constants: "rollup-plugin-node-polyfills/polyfills/constants",
			// _stream_duplex: "rollup-plugin-node-polyfills/polyfills/readable-stream/duplex",
			// _stream_passthrough: "rollup-plugin-node-polyfills/polyfills/readable-stream/passthrough",
			// _stream_readable: "rollup-plugin-node-polyfills/polyfills/readable-stream/readable",
			// _stream_writable: "rollup-plugin-node-polyfills/polyfills/readable-stream/writable",
			// _stream_transform: "rollup-plugin-node-polyfills/polyfills/readable-stream/transform",
			// timers: "rollup-plugin-node-polyfills/polyfills/timers",
			// console: "rollup-plugin-node-polyfills/polyfills/console",
			// vm: "rollup-plugin-node-polyfills/polyfills/vm",
			// zlib: "rollup-plugin-node-polyfills/polyfills/zlib",
			// tty: "rollup-plugin-node-polyfills/polyfills/tty",
			// domain: "rollup-plugin-node-polyfills/polyfills/domain"
		}
	},
	build: {
		minify : false,
		// rollupOptions: {
		// 	plugins: [
		// 		// Enable rollup polyfills plugin
		// 		// used during production bundling
		// 		rollupNodePolyFill(),
		// 	],
		// },
		lib: {
			entry: resolve(__dirname, 'lib/main.js'),
			name: 'logger',
			fileName: (format) => `logger.${format}.js`
		}
	},
	optimizeDeps: {
		esbuildOptions: {
			// define: {
			// 	global: "globalThis",
			// 	'process': {
			// 		env: {
			// 			NODE_DEBUG: false
			// 		}
			// 	}
			// },
			plugins: [
				NodeGlobalsPolyfillPlugin({
					process: true,
					buffer: true
				}),
				NodeModulesPolyfillPlugin()
			]
		}
	}
});
