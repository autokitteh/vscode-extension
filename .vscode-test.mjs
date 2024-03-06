import { defineConfig } from "@vscode/test-cli";

export default defineConfig([
	{
		label: "unitTests",
		files: "dist/src/test/**/*.test.js",
		workspaceFolder: ".",
	},
]);
