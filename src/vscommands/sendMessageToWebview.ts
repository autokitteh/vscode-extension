import { AutokittehSidebar } from "@panels";
import { Message, MessageType } from "@type";
import * as vscode from "vscode";

export const sendMessageToWebview = (leftPane: AutokittehSidebar): any => {
	/* vscode.window
		.showInputBox({
			prompt: "Send message to Webview",
		})
		.then(() => {
			if (vscode.workspace.workspaceFolders !== undefined) {
				// Workspace Uri
				let wf = vscode.workspace.workspaceFolders[0].uri.path;
				vscode.window.showInformationMessage(wf);
				leftPane.postMessageToWebview<Message>({
					type: MessageType.common,
					payload: wf,
				});
			} else {
				const message = "YOUR-EXTENSION: Working folder not found, open a folder an try again";

				// vscode.window.showErrorMessage(message);
			}
		});
		*/
};
