import { commands, window } from "vscode";
import { parse as parseYaml } from "yaml";

import { getFirstMetadataValue } from "@api";
import { Code, ConnectError } from "@connectrpc/connect";
import { namespaces, vsCommands, SUPPORT_EMAIL } from "@constants";
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

	const parsedYaml = parseYaml(manifestYaml);
	const projectName = parsedYaml.project.name;

	const { error: createError } = await ProjectsService.create({
		name: projectName,
		organizationId,
	});

	if (createError) {
		// Handle specific error types with custom messages
		if (createError instanceof ConnectError) {
			const errorType = getFirstMetadataValue(createError, "x-error-type");

			// Don't show error for AlreadyExists - it's handled silently
			if (createError.code === Code.AlreadyExists) {
				// Project already exists, continue to apply manifest
			} else if (errorType === "quota_limit_exceeded") {
				// Show quota exceeded error with details
				const quotaLimit = getFirstMetadataValue(createError, "x-quota-limit");
				const quotaLimitUsed = getFirstMetadataValue(createError, "x-quota-used");
				const quotaLimitResource = getFirstMetadataValue(createError, "x-quota-resource");

				commands.executeCommand(
					vsCommands.showErrorMessage,
					translate().t("errors.quotaLimitExceeded", {
						limit: quotaLimit,
						used: quotaLimitUsed,
						resource: quotaLimitResource,
						email: SUPPORT_EMAIL,
					})
				);
				return;
			} else if (errorType === "rate_limit_exceeded") {
				// Show rate limit error
				commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.rateLimitExceeded"));
				return;
			} else if (createError.code === Code.ResourceExhausted) {
				// Generic resource exhausted error
				commands.executeCommand(
					vsCommands.showErrorMessage,
					translate().t("errors.resourceExhausted", { email: SUPPORT_EMAIL })
				);
				return;
			} else if (createError.code === Code.Unauthenticated) {
				// Show auth error
				commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.unauthenticated"));
				return;
			} else if (createError.code === Code.PermissionDenied) {
				// Show permission error
				commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.permissionDenied"));
				return;
			} else {
				// Show generic error
				commands.executeCommand(vsCommands.showErrorMessage, namespaces.applyManifest, createError.message);
				return;
			}
		} else {
			// Non-ConnectError
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
