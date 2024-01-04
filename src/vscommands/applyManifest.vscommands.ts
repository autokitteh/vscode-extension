import * as path from "path";
import { ConnectError } from "@connectrpc/connect";
import { vsCommands } from "@constants";
import { errorHelper } from "@controllers/utilities/errorHelper";
import { translate } from "@i18n";
import { ManifestService } from "@services";
import { commands, window } from "vscode";

export const applyManifest = async () => {
	let output = window.createOutputChannel("autokitteh");

	if (!window.activeTextEditor) {
		return;
	}

	let { document } = window.activeTextEditor;
	const mainfestYaml = document.getText();
	const filePath = document.uri.fsPath;
	const fileDirPath = path.dirname(filePath);

	output.clear();

	const { data: logs, error } = await ManifestService.applyManifest(mainfestYaml, fileDirPath);
	if (error) {
		errorHelper(error);

		if (error instanceof ConnectError) {
			output.appendLine(error.rawMessage);
		}
		return;
	}
	(logs || []).forEach((log) => output.appendLine(`${log}\r\n`));
	commands.executeCommand(
		vsCommands.showInfoMessage,
		translate().t("manifest.appliedSuccessfully")
	);

	output.show();
};
