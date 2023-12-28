import { manifestClient } from "@api/grpc/clients.grpc.api";
import { vsCommands } from "@constants";
import { commands, window } from "vscode";

export const applyManifest = async () => {
	let output = window.createOutputChannel("autokitteh");

	if (!window.activeTextEditor) {
		return;
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

		commands.executeCommand(vsCommands.showInfoMessage, "Manifest applied");
	}

	output.show();
};
