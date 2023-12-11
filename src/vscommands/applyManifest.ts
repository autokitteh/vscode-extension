import { manifestService } from "@services/services";
import * as vscode from "vscode";

export const applyManifest = async () => {
	let output = vscode.window.createOutputChannel("autokitteh");

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
		(resp.operations || []).forEach((o: any) => output.appendLine(`operation: ${o.description}`));

		vscode.window.showInformationMessage("Manifest applied");
	}

	output.show();
};
