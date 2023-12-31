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
	const text = document.getText();

	output.clear();

	const { data: logs, error } = await ManifestService.applyManifest(text);
	if (error) {
		errorHelper(error);
		return;
	}
	(logs || []).forEach((log) => output.appendLine(`${log}\r\n`));
	commands.executeCommand(
		vsCommands.showInfoMessage,
		translate().t("manifest.appliedSuccessfully")
	);

	output.show();
};
