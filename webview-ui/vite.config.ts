import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

export default defineConfig({
	resolve: {
		alias: {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			"@type": path.resolve(__dirname, "../src/types"),
			// eslint-disable-next-line @typescript-eslint/naming-convention
			"@ak-proto-ts": path.resolve(__dirname, "../src/autokitteh/proto/gen/ts/autokitteh"),
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
