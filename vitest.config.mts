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
		},
		exclude: ["node_modules", "dist"],
	},
});
