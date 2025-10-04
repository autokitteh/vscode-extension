import { commands, window } from "vscode";
import * as yaml from "yaml";

import { Code, ConnectError } from "@connectrpc/connect";
import { namespaces, vsCommands } from "@constants";
import { getLocalResources } from "@controllers/utilities";
import { translate } from "@i18n";
import { LoggerService, ManifestService, ProjectsService } from "@services";
import { getDirectoryOfFile, WorkspaceConfig } from "@utilities";

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

	const manifestYaml = document.getText();
	const filePath = document.uri.fsPath;

	const organizationId =
		((await commands.executeCommand(vsCommands.getContext, "organizationId")) as string) || undefined;

	const parsedYaml = yaml.parse(manifestYaml);
	const projectName = parsedYaml.project.name;

	// Try to create project, but continue if it already exists
	const { error: createError } = await ProjectsService.create({
		name: projectName,
		organizationId,
	});

	// Only return early if error is NOT "project already exists"
	// The interceptor already showed the error message for AlreadyExists, so we just continue
	if (createError) {
		const isAlreadyExists = createError instanceof ConnectError && createError.code === Code.AlreadyExists;
		if (!isAlreadyExists) {
			commands.executeCommand(vsCommands.showErrorMessage, namespaces.applyManifest, (createError as Error).message);
			return;
		}
		// Project already exists, continue to apply manifest
	}

	try {
		const { data: manifestResponse, error } = await ManifestService.applyManifest(
			manifestYaml,
			filePath,
			organizationId
		);
		if (error) {
			throw error;
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
	} catch (error) {
		commands.executeCommand(vsCommands.showErrorMessage, namespaces.applyManifest, (error as Error).message);
		return;
	}
};
