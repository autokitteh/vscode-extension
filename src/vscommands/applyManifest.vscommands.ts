import { namespaces, vsCommands } from "@constants";
import { translate } from "@i18n";
import { LoggerService, ManifestService } from "@services";
import { getDirectoryOfFile } from "@utilities";
import { commands, window } from "vscode";

export const applyManifest = async () => {
	if (!window.activeTextEditor) {
		return;
	}

	let { document } = window.activeTextEditor;
	const mainfestYaml = document.getText();
	const filePath = document.uri.fsPath;
	const { data: manifestResponse, error } = await ManifestService.applyManifest(mainfestYaml, filePath);
	if (error) {
		commands.executeCommand(vsCommands.showErrorMessage, namespaces.applyManifest, (error as Error).message);

		return;
	}

	const manifestDirectory = getDirectoryOfFile(filePath);

	const { logs, projectIds } = manifestResponse!;

	await commands.executeCommand(vsCommands.setContext, projectIds[0], { path: manifestDirectory });

	(logs || []).forEach((log) => LoggerService.info(namespaces.applyManifest, `${log}`));
	commands.executeCommand(vsCommands.showInfoMessage, translate().t("manifest.appliedSuccessfully"));
};
