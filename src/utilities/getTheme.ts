import { window } from "vscode";

export const getTheme = (): number => {
	const theme = window.activeColorTheme.kind;
	return theme;
};
