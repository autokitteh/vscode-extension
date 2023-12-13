import { Theme } from "@enums/theme";
import { AKWebview } from "@panels/index";
import { Message, MessageType } from "@type/message";
import { window } from "vscode";

export const changeTheme = (
	currentWebview: typeof AKWebview | undefined,
	editorThemeKind?: number
) => {
	if (currentWebview && currentWebview.currentPanel) {
		const themeKind = (editorThemeKind || window.activeColorTheme.kind) as number as Theme;

		currentWebview.currentPanel.postMessageToWebview<Message>({
			type: MessageType.theme,
			payload: themeKind,
		});
	}
};

export const themeWatcher = (currentWebview: typeof AKWebview | undefined) => {
	/*** On theme change:
	 * Send the theme to the webview (light/dark)
	 */
	window.onDidChangeActiveColorTheme((editor) => {
		if (editor) {
			const themeKind = (editor.kind || window.activeColorTheme.kind) as number as Theme;
			if (currentWebview && currentWebview.currentPanel) {
				currentWebview.currentPanel.postMessageToWebview<Message>({
					type: MessageType.theme,
					payload: themeKind,
				});
			}
			changeTheme(currentWebview, editor.kind);
		}
	});
};
