import { projectsClient } from "@api/grpc/clients.grpc.api";
import { namespaces, vsCommands } from "@constants";
import { translate } from "@i18n";
import { convertProjectProtoToModel } from "@models";
import { DeploymentsService, EnvironmentsService, LoggerService } from "@services";
import { ServiceResponse } from "@type";
import { Project } from "@type/models";
import { commands } from "vscode";

export class ProjectsService {
	static async get(projectId: string): Promise<ServiceResponse<Project>> {
		try {
			const { project } = await projectsClient.get({ projectId });
			if (!project) {
				LoggerService.error(namespaces.projectService, translate().t("errors.projectNotFound"));
			}
			return { data: project, error: undefined };
		} catch (error) {
			LoggerService.error(namespaces.projectService, (error as Error).message);

			return { data: undefined, error };
		}
	}

	static async list(): Promise<ServiceResponse<Project[]>> {
		try {
			const projects = (await projectsClient.listForOwner({ ownerId: "" })).projects.map(
				convertProjectProtoToModel
			);
			return { data: projects, error: undefined };
		} catch (error) {
			LoggerService.error(namespaces.projectService, (error as Error).message);
			return { data: undefined, error };
		}
	}

	static async build(projectId: string): Promise<ServiceResponse<string>> {
		const { buildId, error } = await projectsClient.build({ projectId });
		if (error) {
			LoggerService.error(namespaces.projectService, error.message);
		}
		return { data: buildId, error: error };
	}

	static async deploy(projectId: string): Promise<ServiceResponse<string>> {
		const { data: buildId, error: buildError } = await this.build(projectId);
		if (buildError) {
			LoggerService.error(namespaces.projectService, (buildError as Error).message);
			return { data: undefined, error: buildError };
		}

		const { data: environments, error: envError } =
			await EnvironmentsService.listByProjectId(projectId);
		if (envError) {
			LoggerService.error(namespaces.projectService, (envError as Error).message);

			return { data: undefined, error: envError };
		}

		let environment;
		try {
			environment = environments![0];
		} catch (error) {
			LoggerService.error(namespaces.projectService, (error as Error).message);
		}

		const { data: deploymentId, error } = await DeploymentsService.create({
			buildId: buildId!,
			envId: environment!.envId,
		});

		if (error) {
			LoggerService.error(namespaces.projectService, (error as Error).message);
		}

		return { data: deploymentId, error: error };
	}

	static async run(projectId: string): Promise<ServiceResponse<string>> {
		const { data: deploymentId, error } = await this.deploy(projectId);
		if (error) {
			LoggerService.error(namespaces.projectService, (error as Error).message);
			commands.executeCommand(vsCommands.showErrorMessage, namespaces.deploymentsService, error);

			return { data: undefined, error: error };
		}
		if (deploymentId) {
			try {
				const { error } = await DeploymentsService.activate(deploymentId);
				if (error) {
					LoggerService.error(namespaces.projectService, (error as Error).message);
				}
				return { data: deploymentId, error: error };
			} catch (error) {
				LoggerService.error(namespaces.projectService, (error as Error).message);

				return { data: undefined, error: error };
			}
		} else {
			LoggerService.error(namespaces.projectService, translate().t("errors.deploymentFailed"));

			return { data: undefined, error: new Error(translate().t("errors.deploymentFailed")) };
		}
	}
}
