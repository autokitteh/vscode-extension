import { vi } from "vitest";

export const vscodeMock = {
	workspace: {
		getConfiguration: () => ({
			get: (key: string) => {
				if (key === "baseURL") {
					return "http://autokitteh.com";
				}
				return null;
			},
		}),
	},
	window: {
		activeColorTheme: {
			kind: 2,
		},
	},
	commands: {
		executeCommand: vi.fn(),
	},
};
