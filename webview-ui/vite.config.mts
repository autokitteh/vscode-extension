/* eslint-disable @typescript-eslint/naming-convention */
import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

export default defineConfig({
	resolve: {
		alias: {
			"@type": path.resolve(__dirname, "../src/types"),
			"@enums": path.resolve(__dirname, "../src/enums"),
			"@assets": path.resolve(__dirname, "./assets"),
			"@components": path.resolve(__dirname, "./src/components"),
			"@utilities": path.resolve(__dirname, "./src/utilities"),
			"@sections": path.resolve(__dirname, "./src/sections"),
			"@interfaces": path.resolve(__dirname, "./src/interfaces"),
			"@ak-proto-ts": path.resolve(__dirname, "../src/autokitteh/proto/gen/ts/autokitteh"),
			"@i18n": path.resolve(__dirname, "../src/i18n"),
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
