/* eslint-disable @typescript-eslint/naming-convention */
/// <reference types="vitest" />

import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["tests/**/*.test.ts"],
		alias: {
			"@utilities": path.resolve(__dirname, "./src/utilities"),
			"@constants": path.resolve(__dirname, "./src/constants"),
			"@i18n": path.resolve(__dirname, "./src/i18n"),
			"@interfaces": path.resolve(__dirname, "./src/interfaces"),
			"@enums": path.resolve(__dirname, "./src/enums"),
			"@controllers": path.resolve(__dirname, "./src/controllers"),
			"@services": path.resolve(__dirname, "./src/services"),
			"@api": path.resolve(__dirname, "./src/api"),
			"@models": path.resolve(__dirname, "./src/models"),
			"@views": path.resolve(__dirname, "./src/views"),
			"@tests": path.resolve(__dirname, "./tests"),
			"@ak-proto-ts": path.resolve(__dirname, "./src/autokitteh/proto/gen/ts/autokitteh"),
		},
		exclude: ["node_modules", "dist"],
	},
});
