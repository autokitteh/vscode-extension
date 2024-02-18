const path = require("path");
const { runTests } = require("vscode-test");

async function main() {
	try {
		const extensionDevelopmentPath = path.resolve(__dirname);
		const extensionTestsPath = path.resolve(__dirname, "./runMochaTests.js"); // Adjust as necessary

		await runTests({
			version: "stable",
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [
				"--disable-extensions",
				// Add additional arguments as needed
			],
		});
	} catch (error) {
		console.error("------------------------------");

		console.error("Error running tests:", error);
		process.exit(1);
	}
}

main();
