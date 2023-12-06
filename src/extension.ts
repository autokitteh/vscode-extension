import { commands, ExtensionContext } from "vscode";
import { HelloWorldPanel } from "./panels/HelloWorldPanel";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { manifestService } from "./services";
import { EXTENSION_CONSTANT } from "./constants";
import { LeftPanelWebview } from "./panels/webview-provider";
import { CommonMessage, ThemeMessage } from "./types/message";
import { Theme } from "./enums/theme";

export function activate(context: ExtensionContext) {
	const showHelloWorldCommand = commands.registerCommand("hello-world.showHelloWorld", () => {
		HelloWorldPanel.render(context.extensionUri);
	});
	context.subscriptions.push(showHelloWorldCommand);
	const leftPane = new LeftPanelWebview(context.extensionUri, {});

	const view = vscode.window.registerWebviewViewProvider(
		EXTENSION_CONSTANT.LEFT_PANEL_WEBVIEW_ID,
		leftPane
	);
	context.subscriptions.push(view);

	const disposable = vscode.commands.registerCommand(
		"autokitteh.v2.buildFolder",
		async function (folder) {
			const mainStarPath = folder.path.replace("autokitteh.yaml", "main.star");

			if (!fs.existsSync(mainStarPath)) {
				vscode.window.showErrorMessage("main.star not found");
				return;
			}
		}
	);

	context.subscriptions.push(disposable);

	/*** On change:
	 * Send the theme to the webview (light/dark)
	 */
	vscode.window.onDidChangeActiveColorTheme((editor) => {
		if (editor) {
			leftPane.postMessageToWebview<ThemeMessage>({
				type: "THEME",
				payload: editor.kind as number as Theme,
			});
		}
	});

	vscode.commands.registerCommand("extension.sendMessage", () => {
		vscode.window
			// @TODO: extract to a separate file
			.showInputBox({
				prompt: "Send message to Webview",
			})
			.then(() => {
				if (vscode.workspace.workspaceFolders !== undefined) {
					let wf = vscode.workspace.workspaceFolders[0].uri.path;
					vscode.window.showInformationMessage(wf);
					leftPane.postMessageToWebview<CommonMessage>({
						type: "COMMON",
						payload: wf,
					});
				} else {
					const message = "YOUR-EXTENSION: Working folder not found, open a folder an try again";

					vscode.window.showErrorMessage(message);
				}
			});
	});

	let output = vscode.window.createOutputChannel("autokitteh");

	context.subscriptions.push(
		// @TODO: extract this registerCommand to a separate file
		vscode.commands.registerCommand("autokitteh.v2.applyManifest", async () => {
			if (!vscode.window.activeTextEditor) {
				return; // no editor
			}

			let { document } = vscode.window.activeTextEditor;
			const text = document.getText();

			output.clear();

			// @TODO: Check if the current directory contains an autokitteh.yaml file and main.star file.
			// For a reference implementation, see in the `src/panels/messageListener.ts` file.
			const resp = await manifestService.applyManifest(text);
			if (resp.error) {
				const msg = `apply: ${resp.stage ? `${resp.stage}: ` : ""}${resp.error}`;

				output.appendLine(msg);

				vscode.window.showErrorMessage("apply failed, check outout");
			} else {
				(resp.logs || []).forEach((l) =>
					output.appendLine(`${l.msg} ${l.data ? ` (${JSON.stringify(l.data)})` : ""}`)
				);
				(resp.operations || []).forEach((o: any) =>
					output.appendLine(`operation: ${o.description}`)
				);

				vscode.window.showInformationMessage("Manifest applied");
			}

			output.show();
		})
	);
}
