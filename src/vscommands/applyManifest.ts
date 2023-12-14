import { manifestClient } from "@api/grpc/clients";
import * as vscode from "vscode";

export const applyManifest = async () => {
	let output = vscode.window.createOutputChannel("autokitteh");

	if (!vscode.window.activeTextEditor) {
		return; // no editor
	}

	let { document } = vscode.window.activeTextEditor;
	const text = document.getText();

	output.clear();

	const resp = await manifestClient.applyManifest(text);
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
