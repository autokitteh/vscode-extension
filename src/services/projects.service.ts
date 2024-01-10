import { ActivateResponse } from "@ak-proto-ts/deployments/v1/svc_pb";
import { projectsClient } from "@api/grpc/clients.grpc.api";
import { namespaces } from "@constants";
import { LoggerLevel } from "@enums";
import { translate } from "@i18n";
import { convertProjectProtoToModel } from "@models";
import { DeploymentsService, EnvironmentsService, LoggerService } from "@services";
import { ServiceResponse } from "@type";
import { Project } from "@type/models";

export class ProjectsService {
	static async get(projectId: string): Promise<ServiceResponse<Project>> {
		try {
			const { project } = await projectsClient.get({ projectId });
			if (!project) {
				LoggerService.log(
					namespaces.projectService,
					translate().t("errors.projectNotFound"),
					LoggerLevel.error
				);
			}
			return { data: project, error: undefined };
		} catch (error) {
			LoggerService.log(namespaces.projectService, (error as Error).message, LoggerLevel.error);

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
			LoggerService.log(namespaces.projectService, (error as Error).message, LoggerLevel.error);
			return { data: undefined, error };
		}
	}

	static async build(projectId: string): Promise<ServiceResponse<string>> {
		const { buildId, error } = await projectsClient.build({ projectId });
		if (error) {
			LoggerService.log(namespaces.projectService, error.message, LoggerLevel.error);
		}
		return { data: buildId, error: error };
	}

	static async deploy(projectId: string): Promise<ServiceResponse<string>> {
		const { data: buildId, error: buildError } = await this.build(projectId);
		if (buildError) {
			LoggerService.log(
				namespaces.projectService,
				(buildError as Error).message,
				LoggerLevel.error
			);
			return { data: undefined, error: buildError };
		}

		const { data: environments, error: envError } =
			await EnvironmentsService.listByProjectId(projectId);
		if (envError) {
			LoggerService.log(namespaces.projectService, (envError as Error).message, LoggerLevel.error);

			return { data: undefined, error: envError };
		}

		let environment;
		try {
			environment = environments![0];
		} catch (error) {
			LoggerService.log(namespaces.projectService, (error as Error).message, LoggerLevel.error);
		}

		const { data: deploymentId, error } = await DeploymentsService.create({
			buildId: buildId!,
			envId: environment!.envId,
		});

		if (error) {
			LoggerService.log(namespaces.projectService, (error as Error).message, LoggerLevel.error);
		}

		return { data: deploymentId, error: error };
	}

	static async run(projectId: string): Promise<ServiceResponse<ActivateResponse>> {
		const { data: deploymentId } = await this.deploy(projectId);
		if (deploymentId) {
			try {
				const { data: activateResponse, error } = await DeploymentsService.activate(deploymentId);
				if (error) {
					LoggerService.log(namespaces.projectService, (error as Error).message, LoggerLevel.error);
				}
				return { data: activateResponse, error: error };
			} catch (error) {
				LoggerService.log(namespaces.projectService, (error as Error).message, LoggerLevel.error);

				return { data: undefined, error: error };
			}
		} else {
			LoggerService.log(
				namespaces.projectService,
				translate().t("errors.deploymentFailed"),
				LoggerLevel.error
			);

			return { data: undefined, error: new Error(translate().t("errors.deploymentFailed")) };
		}
	}
}
