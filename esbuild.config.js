const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: "esbuild-problem-matcher",

	setup(build) {
		build.onStart(() => {
			console.log("[watch] build started");
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log("[watch] build finished");
		});
	},
};

/**
 * Helper function to find the actual file with proper extension
 */
function findFileWithExtension(basePath) {
	const extensions = [".ts", ".tsx", ".js", ".jsx", ".json"];

	// If basePath is a file with extension, return it
	if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {
		return basePath;
	}

	for (const ext of extensions) {
		const fullPath = basePath + ext;
		if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
			return fullPath;
		}
	}

	if (fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()) {
		for (const ext of extensions) {
			const indexPath = path.join(basePath, `index${ext}`);
			if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
				return indexPath;
			}
		}
	}

	return basePath;
}

/**
 * Plugin to resolve TypeScript path aliases
 * @type {import('esbuild').Plugin}
 */
const pathAliasPlugin = {
	name: "path-alias",
	setup(build) {
		/* eslint-disable @typescript-eslint/naming-convention */
		const aliases = {
			"@ak-proto-ts": "src/autokitteh/proto/gen/ts/autokitteh",
			"@eventEmitter": "src/eventEmitter",
			"@api": "src/api",
			"@constants": "src/constants",
			"@controllers": "src/controllers",
			"@enums": "src/enums",
			"@models": "src/models",
			"@i18n": "src/i18n",
			"@interfaces": "src/interfaces",
			"@providers": "src/providers",
			"@services": "src/services",
			"@type": "src/types",
			"@utilities": "src/utilities",
			"@views": "src/views",
			"@vscommands": "src/vscommands",
			"@tests": "tests",
		};
		/* eslint-enable @typescript-eslint/naming-convention */

		for (const [alias, target] of Object.entries(aliases)) {
			build.onResolve({ filter: new RegExp(`^${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) }, () => {
				const basePath = path.resolve(__dirname, target);
				const resolvedPath = findFileWithExtension(basePath);
				return { path: resolvedPath };
			});

			build.onResolve({ filter: new RegExp(`^${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/`) }, (args) => {
				const subPath = args.path.substring(alias.length + 1);
				const basePath = path.resolve(__dirname, target, subPath);
				const resolvedPath = findFileWithExtension(basePath);
				return { path: resolvedPath };
			});
		}
	},
};

async function main() {
	const ctx = await esbuild.context({
		entryPoints: ["src/extension.ts"],
		bundle: true,
		format: "cjs",
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: "node",
		outfile: "dist/main.js",
		external: ["vscode", "fswin"],
		logLevel: "silent",
		plugins: [pathAliasPlugin, esbuildProblemMatcherPlugin],
	});

	if (watch) {
		await ctx.watch();
	} else {
		await ctx.rebuild();
		await ctx.dispose();
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
