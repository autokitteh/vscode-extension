/* eslint-disable @typescript-eslint/naming-convention */
import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

export default defineConfig({
	resolve: {
		alias: {
			"@parent-type": path.resolve(__dirname, "../src/types"),
			"@parent-enums": path.resolve(__dirname, "../src/enums"),
			"@assets": path.resolve(__dirname, "./assets"),
			"@type": path.resolve(__dirname, "../src/types"),
			"@components": path.resolve(__dirname, "./src/components"),
			"@utilities": path.resolve(__dirname, "./src/utilities"),
			"@sections": path.resolve(__dirname, "./src/sections"),
			"@interfaces": path.resolve(__dirname, "./src/interfaces"),
			"@parent-ak-proto-ts": path.resolve(__dirname, "../src/autokitteh/proto/gen/ts/autokitteh"),
		},
	},

	plugins: [
		react({
			include: "**/*.tsx",
		}),
		svgr(),
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
