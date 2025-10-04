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

	const { error: createError } = await ProjectsService.create({
		name: projectName,
		organizationId,
	});

	if (createError) {
		const isAlreadyExists = createError instanceof ConnectError && createError.code === Code.AlreadyExists;
		if (!isAlreadyExists) {
			commands.executeCommand(vsCommands.showErrorMessage, namespaces.applyManifest, (createError as Error).message);
			return;
		}
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
		const currentProjectPaths = (await commands.executeCommand(
			vsCommands.getContext,
			"projectsPaths"
		)) as unknown as string;

		let vscodeProjectsPaths = JSON.parse(currentProjectPaths);

		if (projectIds.length > 0) {
			vscodeProjectsPaths[projectIds[0]] = manifestDirectory;
			await commands.executeCommand(vsCommands.setContext, "projectsPaths", JSON.stringify(vscodeProjectsPaths));

			const organizationName =
				((await commands.executeCommand(vsCommands.getContext, "organizationName")) as string) || undefined;
			await commands.executeCommand(vsCommands.reloadProjects, organizationId, organizationName);

			(logs || []).forEach((log) => LoggerService.info(namespaces.applyManifest, `${log}`));
			commands.executeCommand(vsCommands.showInfoMessage, translate().t("manifest.appliedSuccessfully"));
			setTimeout(() => commands.executeCommand(vsCommands.refreshSidebar), 2500);
		}

		if (!Object.keys(vscodeProjectsPaths || {}).length) {
			LoggerService.error(namespaces.projectService, translate().t("projects.noProjectSavedInVSCodeSettings"));
			commands.executeCommand(vsCommands.showErrorMessage, translate().t("projects.noProjectSavedInVSCodeSettings"));
			return;
		}

		if (!projectIds.length) {
			return;
		}

		let projectId: string | undefined;

		for (const [projId, projPath] of Object.entries(vscodeProjectsPaths)) {
			if (manifestDirectory === projPath) {
				projectId = projId;
				break;
			}
		}

		if (!projectId) {
			const errorMsg = translate().t("projects.notInProject", { dirPath: manifestDirectory });
			LoggerService.error(namespaces.projectService, errorMsg);
			return;
		}
		const currentOrganizationId =
			((await commands.executeCommand(vsCommands.getContext, "organizationId")) as string) || undefined;
		if (!currentOrganizationId) {
			const authToken = WorkspaceConfig.getFromWorkspace<string>("authToken", "");

			if (authToken) {
				LoggerService.error(namespaces.projectService, translate().t("projects.noOrganizationSelected"));
				await commands.executeCommand(vsCommands.changeOrganization);
				return;
			}
		}

		const projectPath = vscodeProjectsPaths[projectId] as string;
		const { data: resources, error: resourcesError } = await getLocalResources(projectPath, projectId);

		if (resourcesError || !resources) {
			LoggerService.error(
				namespaces.projectService,
				translate().t("projects.collectResourcesFailed", { error: resourcesError?.message || "Unknown error" })
			);
			return;
		}

		const filteredResources = { ...resources };
		delete filteredResources["autokitteh.yaml"];

		const { error: setResourcesError } = await ProjectsService.setResources(projectId, filteredResources);

		if (setResourcesError) {
			LoggerService.error(
				namespaces.projectService,
				translate().t("projects.setResourcesFailed", { error: setResourcesError || "Unknown error" })
			);
			commands.executeCommand(
				vsCommands.showErrorMessage,
				translate().t("projects.setResourcesFailed", { error: setResourcesError || "Unknown error" })
			);
			return;
		}
		LoggerService.info(namespaces.projectService, translate().t("projects.resourcesSetSuccess", { projectId }));
		commands.executeCommand(
			vsCommands.showInfoMessage,
			translate().t("projects.resourcesUpdatedSuccess", { projectId })
		);
	} catch (error) {
		commands.executeCommand(vsCommands.showErrorMessage, namespaces.applyManifest, (error as Error).message);
		return;
	}
};
