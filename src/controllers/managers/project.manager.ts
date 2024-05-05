import { vsCommands, namespaces } from "@constants";
import { translate } from "@i18n";
import { ProjectsService } from "@services";
import { LoggerService } from "@services";
import { Callback } from "@type/interfaces";
import { Project } from "@type/models";
import { commands } from "vscode";

export class ProjectManager {
	async getProjectById(projectId: string): Promise<Project | undefined> {
		const { data: project, error } = await ProjectsService.get(projectId);
		if (error) {
			LoggerService.error(namespaces.projectController, (error as Error).message);
			commands.executeCommand(
				vsCommands.showErrorMessage,
				translate().t("projects.projectNotFoundWithID", { id: projectId })
			);
			return;
		}
		return project;
	}

	async deleteProject(projectId: string, projectName: string, onProjectDeleteCB?: Callback<string>): Promise<void> {
		const { error } = await ProjectsService.delete(projectId);
		if (error) {
			const notification = translate().t("projects.deleteFailed", { projectName });
			const log = translate().t("projects.deleteFailedError", { projectName, error });
			commands.executeCommand(vsCommands.showErrorMessage, notification);
			LoggerService.error(namespaces.projectController, log);
			return;
		}
		const successMessage = translate().t("projects.deleteSucceed", { projectName });
		commands.executeCommand(vsCommands.showInfoMessage, successMessage);
		LoggerService.info(namespaces.projectController, successMessage);
		onProjectDeleteCB?.(projectId);
	}

	async buildProject(projectId: string, mappedResources: any): Promise<string | undefined> {
		const { data: buildId, error } = await ProjectsService.build(projectId, mappedResources);
		if (error) {
			const notification = translate().t("projects.projectBuildFailed", { id: projectId });
			const log = `${notification} - ${(error as Error).message}`;
			commands.executeCommand(vsCommands.showErrorMessage, notification);
			LoggerService.error(namespaces.projectController, log);
			return;
		}
		return buildId;
	}

	async runProject(projectId: string, mappedResources: any): Promise<string | undefined> {
		const { data: deploymentId, error } = await ProjectsService.run(projectId, mappedResources);
		if (error) {
			const notification = translate().t("projects.projectDeployFailed", { id: projectId });
			const log = `${notification} - ${(error as Error).message}`;
			LoggerService.error(namespaces.projectController, log);
			commands.executeCommand(vsCommands.showErrorMessage, notification);
			return;
		}
		return deploymentId;
	}

	async getResources(projectId: string, projectName: string): Promise<{ [key: string]: Uint8Array } | undefined> {
		const { data: existingResources, error } = await ProjectsService.getResources(projectId);
		if (error) {
			const notification = translate().t("projects.downloadResourcesDirectoryErrorForProject", {
				projectName,
			});
			const log = translate().t("projects.downloadResourcesDirectoryError", {
				projectName,
				error: (error as Error).message,
			});
			LoggerService.error(namespaces.projectController, log);
			commands.executeCommand(vsCommands.showErrorMessage, notification);
			return;
		}
		return existingResources;
	}
}
