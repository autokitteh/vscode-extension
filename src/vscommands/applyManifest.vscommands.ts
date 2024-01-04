import * as path from "path";
import { ConnectError } from "@connectrpc/connect";
import { vsCommands } from "@constants";
import { errorHelper } from "@controllers/utilities/errorHelper";
import { translate } from "@i18n";
import { LoggerService, ManifestService } from "@services";
import { commands, window } from "vscode";

export const applyManifest = async () => {
	const logger = LoggerService.getInstance();
	if (!window.activeTextEditor) {
		return;
	}

	let { document } = window.activeTextEditor;
	const mainfestYaml = document.getText();
	const filePath = document.uri.fsPath;
	const fileDirPath = path.dirname(filePath);

	const { data: logs, error } = await ManifestService.applyManifest(mainfestYaml, fileDirPath);
	if (error) {
		errorHelper(error);

		if (error instanceof ConnectError) {
			logger.error(error.rawMessage);
		}
		return;
	}
	(logs || []).forEach((log) => logger.log(`${log}`));
	commands.executeCommand(
		vsCommands.showInfoMessage,
		translate().t("manifest.appliedSuccessfully")
	);
};
