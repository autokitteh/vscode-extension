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
	const fileExtension = document.uri.fsPath.split(".").pop();
	if (fileExtension !== "yaml" && fileExtension !== "yml") {
		commands.executeCommand(vsCommands.showErrorMessage, translate().t("manifest.onlyYamlFiles"));
		return;
	}

	const mainfestYaml = document.getText();
	const filePath = document.uri.fsPath;

	const organizationId =
		((await commands.executeCommand(vsCommands.getContext, "organizationId")) as string) || undefined;

	const { data: manifestResponse, error } = await ManifestService.applyManifest(mainfestYaml, filePath, organizationId);
	if (error) {
		commands.executeCommand(vsCommands.showErrorMessage, namespaces.applyManifest, (error as Error).message);
		return;
	}

	const manifestDirectory = getDirectoryOfFile(filePath);

	const { logs, projectIds } = manifestResponse!;
	if (projectIds.length > 0) {
		const currentProjectPaths = (await commands.executeCommand(
			vsCommands.getContext,
			"projectsPaths"
		)) as unknown as string;

		const vscodeProjectsPaths = JSON.parse(currentProjectPaths);
		vscodeProjectsPaths[projectIds[0]] = manifestDirectory;

		await commands.executeCommand(vsCommands.setContext, "projectsPaths", JSON.stringify(vscodeProjectsPaths));

		const organizationName =
			((await commands.executeCommand(vsCommands.getContext, "organizationName")) as string) || undefined;
		await commands.executeCommand(vsCommands.reloadProjects, organizationId, organizationName);
	}

	(logs || []).forEach((log) => LoggerService.info(namespaces.applyManifest, `${log}`));
	commands.executeCommand(vsCommands.showInfoMessage, translate().t("manifest.appliedSuccessfully"));
	setTimeout(() => commands.executeCommand(vsCommands.refreshSidebar), 2500);
};
