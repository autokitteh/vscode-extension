const vscode = {
	workspace: {
		getConfiguration: () => ({
			get: (key: string) => (key === "baseURL" ? "http://autokitteh.com" : null),
			has: () => false,
			inspect: () => undefined,
			update: () => Promise.resolve(),
		}),
	},
	window: {
		activeColorTheme: {
			kind: 2,
		},
	},
	commands: {
		executeCommand: () => Promise.resolve(),
	},
};

module.exports = vscode;
