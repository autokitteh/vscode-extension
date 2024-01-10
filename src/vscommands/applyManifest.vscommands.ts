import * as path from "path";
import { namespaces, vsCommands } from "@constants";
import { errorHelper } from "@controllers/utilities/errorHelper";
import { translate } from "@i18n";
import { LoggerService, ManifestService } from "@services";
import { commands, window } from "vscode";

export const applyManifest = async () => {
	const logger = LoggerService;
	if (!window.activeTextEditor) {
		return;
	}

	let { document } = window.activeTextEditor;
	const mainfestYaml = document.getText();
	const filePath = document.uri.fsPath;

	const { data: logs, error } = await ManifestService.applyManifest(mainfestYaml, filePath);
	if (error) {
		errorHelper(namespaces.applyManifest, error);
		return;
	}
	(logs || []).forEach((log) => logger.log(namespaces.applyManifest, `${log}`));
	commands.executeCommand(
		vsCommands.showInfoMessage,
		namespaces.applyManifest,
		translate().t("manifest.appliedSuccessfully")
	);
};
