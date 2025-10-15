import { commands, window } from "vscode";
import { parse as parseYaml } from "yaml";

import { ConnectError } from "@connectrpc/connect";
import { namespaces, vsCommands } from "@constants";
import { getLocalResources } from "@controllers/utilities";
import { translate } from "@i18n";
import { LoggerService, ManifestService, ProjectsService } from "@services";
import { getDirectoryOfFile, handleConnectError } from "@utilities";

export const applyManifest = async () => {
	if (!window.activeTextEditor) {
		return;
	}

	let { document } = window.activeTextEditor;
	const fileExtension = document.uri.fsPath.split(".").pop();
	if (fileExtension !== "yaml" && fileExtension !== "yml") {
		commands.executeCommand(vsCommands.showErrorMessage, translate().t("manifest.onlyYamlFiles"));
		LoggerService.error(
			namespaces.applyManifest,
			translate().t("manifest.onlyYamlFilesLog", { request: "applyManifest" })
		);
		return;
	}

	const manifestYaml = document.getText();
	const filePath = document.uri.fsPath;

	const organizationId =
		((await commands.executeCommand(vsCommands.getContext, "organizationId")) as string) || undefined;

	const parsedYaml = parseYaml(manifestYaml);
	const projectName = parsedYaml.project.name;

	const { data: project } = await ProjectsService.get({ name: projectName, projectId: "" });
	if (project) {
		commands.executeCommand(
			vsCommands.showErrorMessage,
			translate().t("manifest.projectAlreadyExists", { projectName })
		);

		LoggerService.error(
			namespaces.applyManifest,
			translate().t("manifest.projectAlreadyExistsLog", {
				request: "applyManifest",
				projectName,
			})
		);
		return;
	}

	const { error: createError } = await ProjectsService.create({
		name: projectName,
		organizationId,
	});

	if (createError) {
		if (createError instanceof ConnectError) {
			const shouldReturn = handleConnectError(createError, namespaces.applyManifest);
			if (shouldReturn) {
				return;
			}
		} else {
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

		if (!manifestResponse?.projectIds.length) {
			LoggerService.error(
				namespaces.applyManifest,
				translate().t("errors.applyManifestNoProjectsLog", {
					request: "applyManifest",
				})
			);
			return;
		}

		const { logs, projectIds } = manifestResponse!;
		const currentProjectPaths = (await commands.executeCommand(
			vsCommands.getContext,
			"projectsPaths"
		)) as unknown as string;

		let vscodeProjectsPaths = JSON.parse(currentProjectPaths);
		if (!projectIds.length) {
			commands.executeCommand(vsCommands.showErrorMessage, translate().t("manifest.ProjectCreationFailed"));
			LoggerService.error(
				namespaces.applyManifest,
				translate().t("manifest.ProjectCreationFailedLog", {
					request: "applyManifest",
					error: (createError as Error).message,
				})
			);
			return;
		}

		if (Object.keys(vscodeProjectsPaths || {}).length) {
			let projectLocallyExists;

			for (const [projId, projPath] of Object.entries(vscodeProjectsPaths)) {
				if (manifestDirectory === projPath) {
					projectLocallyExists = projId;
					break;
				}
			}

			if (projectLocallyExists) {
				commands.executeCommand(
					vsCommands.showErrorMessage,
					namespaces.applyManifest,
					translate().t("projects.projectLocallyExistsFilesNotUpdated", {
						projectId: projectIds[0],
						directory: manifestDirectory,
					})
				);

				LoggerService.error(
					namespaces.applyManifest,
					translate().t("projects.projectLocallyExistsFilesNotUpdatedLog", {
						projectId: projectIds[0],
						directory: manifestDirectory,
					})
				);
				return;
			}
		}
		const projectId = projectIds[0];
		vscodeProjectsPaths[projectId] = manifestDirectory;
		await commands.executeCommand(vsCommands.setContext, "projectsPaths", JSON.stringify(vscodeProjectsPaths));

		const organizationName =
			((await commands.executeCommand(vsCommands.getContext, "organizationName")) as string) || undefined;
		await commands.executeCommand(vsCommands.reloadProjects, organizationId, organizationName);

		(logs || []).forEach((log) => LoggerService.info(namespaces.applyManifest, `${log}`));
		commands.executeCommand(vsCommands.showInfoMessage, translate().t("manifest.appliedSuccessfully"));
		setTimeout(() => commands.executeCommand(vsCommands.refreshSidebar), 2500);

		const { data: resources, error: resourcesError } = await getLocalResources(manifestDirectory, projectId);

		if (resourcesError || !resources) {
			LoggerService.error(
				namespaces.applyManifest,
				translate().t("projects.collectResourcesFailed", { error: resourcesError?.message || "Unknown error" })
			);
			return;
		}

		const filteredResources = { ...resources };
		delete filteredResources["autokitteh.yaml"];

		const { error: setResourcesError } = await ProjectsService.setResources(projectId, filteredResources);

		if (setResourcesError) {
			LoggerService.error(
				namespaces.applyManifest,
				translate().t("projects.setResourcesFailed", { error: setResourcesError || "Unknown error" })
			);
			commands.executeCommand(
				vsCommands.showErrorMessage,
				translate().t("projects.setResourcesFailed", { error: setResourcesError || "Unknown error" })
			);
			return;
		}
		LoggerService.info(namespaces.applyManifest, translate().t("projects.resourcesSetSuccess", { projectId }));
		commands.executeCommand(
			vsCommands.showInfoMessage,
			translate().t("projects.resourcesUpdatedSuccess", { projectId })
		);
	} catch (error) {
		commands.executeCommand(vsCommands.showErrorMessage, namespaces.applyManifest, (error as Error).message);
		return;
	}
};
