/* eslint-disable @typescript-eslint/naming-convention */
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, type PluginOption } from "vite";
import svgr from "vite-plugin-svgr";

import react from "@vitejs/plugin-react";

export default defineConfig({
	resolve: {
		alias: {
			"@api": path.resolve(__dirname, "../src/api"),
			"@type": path.resolve(__dirname, "../src/types"),
			"@enums": path.resolve(__dirname, "../src/enums"),
			"@models": path.resolve(__dirname, "../src/models"),
			"@constants": path.resolve(__dirname, "../src/constants"),
			"@utilities": path.resolve(__dirname, "../src/utilities"),
			"@services": path.resolve(__dirname, "../src/services"),
			"@starlark": path.resolve(__dirname, "../src/starlark"),
			"@react-assets": path.resolve(__dirname, "./assets"),
			"@react-context": path.resolve(__dirname, "./src/context"),
			"@react-components": path.resolve(__dirname, "./src/components"),
			"@react-enums": path.resolve(__dirname, "./src/enums"),
			"@react-hooks": path.resolve(__dirname, "./src/hooks"),
			"@react-constants": path.resolve(__dirname, "./src/constants"),
			"@react-utilities": path.resolve(__dirname, "./src/utilities"),
			"@react-sections": path.resolve(__dirname, "./src/sections"),
			"@react-interfaces": path.resolve(__dirname, "./src/interfaces"),
			"@react-types": path.resolve(__dirname, "./src/types"),
			"@assets": path.resolve(__dirname, "./assets"),
			"@ak-proto-ts": path.resolve(__dirname, "../src/autokitteh/proto/gen/ts/autokitteh"),
			"@i18n": path.resolve(__dirname, "../src/i18n"),
		},
	},
	plugins: [
		react({
			include: "**/*.tsx",
		}),
		svgr(),
		visualizer() as PluginOption,
	],
	server: {
		watch: {
			usePolling: true,
		},
	},
	build: {
		outDir: "build",
		rollupOptions: {
			output: {
				entryFileNames: `assets/[name].js`,
				chunkFileNames: `assets/[name].js`,
				assetFileNames: `assets/[name].[ext]`,
			},
		},
	},
});
