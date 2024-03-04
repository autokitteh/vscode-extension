import { namespaces, vsCommands } from "@constants";
import { translate } from "@i18n";
import { LoggerService, ManifestService } from "@services";
import { getDirectoryOfFile } from "@utilities";
import * as yaml from "js-yaml";
import { commands, window } from "vscode";

export const applyManifest = async () => {
	if (!window.activeTextEditor) {
		return;
	}

	let { document } = window.activeTextEditor;
	const mainfestYaml = document.getText();
	const filePath = document.uri.fsPath;

	const projectYamlContent = yaml.load(mainfestYaml) as { project: { triggers: any[]; name: string } };
	const triggers = projectYamlContent.project.triggers;
	const entrypoints = triggers.reduce(
		(entrypointsObject, { entrypoint }) => {
			const [filename, functionName] = entrypoint.split(":");
			if (entrypointsObject[filename]) {
				entrypointsObject[filename].push(functionName);
			} else {
				entrypointsObject[filename] = [functionName];
			}
			return entrypointsObject;
		},
		{} as Record<string, string[]>
	);

	await commands.executeCommand(vsCommands.setContext, `${projectYamlContent.project.name}-entrypoints`, {
		entrypoints,
	});

	const { data: manifestResponse, error } = await ManifestService.applyManifest(mainfestYaml, filePath);
	if (error) {
		commands.executeCommand(vsCommands.showErrorMessage, namespaces.applyManifest, (error as Error).message);

		return;
	}

	const manifestDirectory = getDirectoryOfFile(filePath);

	const { logs, projectIds } = manifestResponse!;
	if (projectIds.length > 0) {
		await commands.executeCommand(vsCommands.setContext, projectIds[0], { path: manifestDirectory });
	}

	(logs || []).forEach((log) => LoggerService.info(namespaces.applyManifest, `${log}`));
	commands.executeCommand(vsCommands.showInfoMessage, translate().t("manifest.appliedSuccessfully"));
};
