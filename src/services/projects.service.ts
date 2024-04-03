import { projectsClient } from "@api/grpc/clients.grpc.api";
import { namespaces } from "@constants";
import { translate } from "@i18n";
import { convertErrorProtoToModel, convertProjectProtoToModel } from "@models";
import { DeploymentsService, EnvironmentsService, LoggerService } from "@services";
import { ServiceResponse } from "@type";
import { Project } from "@type/models";

export class ProjectsService {
	static async get(projectId: string): Promise<ServiceResponse<Project>> {
		try {
			const { project } = await projectsClient.get({ projectId });
			if (!project) {
				LoggerService.error(namespaces.projectService, translate().t("errors.projectNotFound"));

				return { data: undefined, error: translate().t("errors.projectNotFound") };
			}
			return { data: project, error: undefined };
		} catch (error) {
			LoggerService.error(namespaces.projectService, (error as Error).message);
			return { data: undefined, error };
		}
	}

	static async list(): Promise<ServiceResponse<Project[]>> {
		try {
			const projects = (await projectsClient.listForOwner({ ownerId: "" })).projects.map(convertProjectProtoToModel);
			return { data: projects, error: undefined };
		} catch (error) {
			LoggerService.error(namespaces.projectService, (error as Error).message);
			return { data: undefined, error };
		}
	}

	static async build(projectId: string, resources: Record<string, Uint8Array>): Promise<ServiceResponse<string>> {
		try {
			await projectsClient.setResources({
				projectId,
				resources,
			});
			const { buildId, error } = await projectsClient.build({ projectId });
			if (error) {
				LoggerService.error(
					`${namespaces.projectService} - Build: `,
					convertErrorProtoToModel(error.value, projectId).message
				);

				return { data: undefined, error };
			}
			return { data: buildId, error: undefined };
		} catch (error) {
			LoggerService.error(
				namespaces.projectService,
				translate().t("errors.buildProjectError", { projectId, error: (error as Error).message })
			);
			return { data: undefined, error: (error as Error).message };
		}
	}

	static async getResources(projectId: string): Promise<ServiceResponse<Record<string, Uint8Array>>> {
		try {
			const { resources } = await projectsClient.downloadResources({ projectId });
			return { data: resources, error: undefined };
		} catch (error) {
			LoggerService.error(
				namespaces.projectService,
				translate().t("errors.downloadResourcesDirectoryErrorExtended", { projectId, error: (error as Error).message })
			);
			return { data: undefined, error: (error as Error).message };
		}
	}

	static async deploy(projectId: string, buildId: string): Promise<ServiceResponse<string>> {
		const { data: environments, error: envError } = await EnvironmentsService.listByProjectId(projectId);
		if (envError) {
			return { data: undefined, error: envError };
		}

		if (!environments?.length) {
			const errorMessage = translate().t("errors.defaultEnvironmentNotFound");
			LoggerService.error(namespaces.projectService, errorMessage);
			return { data: undefined, error: new Error(errorMessage) };
		}

		const environment = environments[0];

		const { data: deploymentId, error } = await DeploymentsService.create({
			buildId: buildId!,
			envId: environment.envId,
		});

		if (error) {
			LoggerService.error(namespaces.projectService, (error as Error).message);
			return { data: undefined, error };
		}

		return { data: deploymentId, error: undefined };
	}

	static async run(projectId: string, resources: Record<string, Uint8Array>): Promise<ServiceResponse<string>> {
		const { data: buildId, error: buildError } = await this.build(projectId, resources);
		if (buildError) {
			return { data: undefined, error: buildError };
		}
		const { data: deploymentId, error } = await this.deploy(projectId, buildId!);
		if (error) {
			LoggerService.error(`${namespaces.projectService} - Deploy`, (error as Error).message);

			return {
				data: undefined,
				error: error,
			};
		}

		const { error: activateError } = await DeploymentsService.activate(deploymentId!);
		if (activateError) {
			LoggerService.error(`${namespaces.projectService} - Activate`, (activateError as Error).message);
			return { data: undefined, error: activateError };
		}
		return { data: deploymentId, error: undefined };
	}
}
