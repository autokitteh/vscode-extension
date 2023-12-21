import { manifestClient } from "@api/grpc/clients";
import { MessageHandler } from "@views";
import { window } from "vscode";

export const applyManifest = async () => {
	let output = window.createOutputChannel("autokitteh");

	if (!window.activeTextEditor) {
		return; // no editor
	}

	let { document } = window.activeTextEditor;
	const text = document.getText();

	output.clear();

	const resp = await manifestClient.applyManifest(text);
	if (resp.error) {
		const msg = `apply: ${resp.stage ? `${resp.stage}: ` : ""}${resp.error}`;

		output.appendLine(msg);

		window.showErrorMessage("apply failed, check outout");
	} else {
		(resp.logs || []).forEach((l) =>
			output.appendLine(`${l.msg} ${l.data ? ` (${JSON.stringify(l.data)})` : ""}`)
		);
		(resp.operations || []).forEach((o: any) => output.appendLine(`operation: ${o.description}`));

		MessageHandler.infoMessage("Manifest applied");
	}

	output.show();
};
