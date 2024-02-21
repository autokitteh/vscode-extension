import { namespaces, vsCommands } from "@constants";
import { translate } from "@i18n";
import { LoggerService, ManifestService } from "@services";
import { commands, window } from "vscode";

export const applyManifest = async () => {
	if (!window.activeTextEditor) {
		return;
	}

	let { document } = window.activeTextEditor;
	const mainfestYaml = document.getText();

	const { data: logs, error } = await ManifestService.applyManifest(mainfestYaml);
	if (error) {
		commands.executeCommand(vsCommands.showErrorMessage, namespaces.applyManifest, (error as Error).message);

		return;
	}
	(logs || []).forEach((log) => LoggerService.info(namespaces.applyManifest, `${log}`));
	commands.executeCommand(vsCommands.showInfoMessage, translate().t("manifest.appliedSuccessfully"));
};
