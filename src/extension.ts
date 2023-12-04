import { commands, ExtensionContext, window } from "vscode";
import { HelloWorldPanel } from "./panels/HelloWorldPanel";
import * as vscode from "vscode";
import { manifestService } from "./services";
import { EXTENSION_CONSTANT } from "./constants";
import { LeftPanelWebview } from "./panels/webview-provider";

export function activate(context: ExtensionContext) {
	// Create the show hello world command
	const showHelloWorldCommand = commands.registerCommand("hello-world.showHelloWorld", () => {
		HelloWorldPanel.render(context.extensionUri);
	});

	// Add command to the extension context
	context.subscriptions.push(showHelloWorldCommand);

	const leftPanelWebViewProvider = new LeftPanelWebview(context?.extensionUri, {});
	let view = vscode.window.registerWebviewViewProvider(
		EXTENSION_CONSTANT.LEFT_PANEL_WEBVIEW_ID,
		leftPanelWebViewProvider
	);
	context.subscriptions.push(view);

	let output = vscode.window.createOutputChannel("autokitteh");

	context.subscriptions.push(
		vscode.commands.registerCommand("autokitteh.v2.applyManifest", async () => {
			if (!vscode.window.activeTextEditor) {
				return; // no editor
			}

			let { document } = vscode.window.activeTextEditor;
			const text = document.getText();

			output.clear();

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
