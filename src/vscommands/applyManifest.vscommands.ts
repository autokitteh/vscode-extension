import { commands, window } from "vscode";

import { namespaces, vsCommands } from "@constants";
import { translate } from "@i18n";
import { LoggerService, ManifestService } from "@services";
import { getDirectoryOfFile } from "@utilities";

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
	if (projectIds.length > 0) {
		const vscodeProjectsPaths = JSON.parse(await commands.executeCommand(vsCommands.getContext, "projectsPaths"));
		vscodeProjectsPaths[projectIds[0]] = manifestDirectory;

		await commands.executeCommand(vsCommands.setContext, "projectsPaths", JSON.stringify(vscodeProjectsPaths));
	}

	(logs || []).forEach((log) => LoggerService.info(namespaces.applyManifest, `${log}`));
	commands.executeCommand(vsCommands.showInfoMessage, translate().t("manifest.appliedSuccessfully"));
	setTimeout(() => commands.executeCommand(vsCommands.refreshSidebar), 2500);
};
