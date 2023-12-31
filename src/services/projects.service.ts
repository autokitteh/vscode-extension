import { ActivateResponse } from "@ak-proto-ts/deployments/v1/svc_pb";
import { projectsClient } from "@api/grpc/clients.grpc.api";
import { DEFAULT_ENVIRONMENT } from "@constants/extensionConfiguration.constants";
import { translate } from "@i18n";
import { convertProjectProtoToModel } from "@models/project.model";
import { DeploymentsService, EnvironmentsService } from "@services";
import { Project } from "@type/models";
import { ServiceResponse } from "@type/services.types";

export class ProjectsService {
	static async get(projectId: string): Promise<ServiceResponse<Project>> {
		try {
			const project = (await projectsClient.get({ projectId })).project;
			return { data: project, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}

	static async list(userId: string): Promise<ServiceResponse<Project[]>> {
		try {
			const projects = (await projectsClient.listForOwner({ ownerId: userId })).projects.map(
				convertProjectProtoToModel
			);
			return { data: projects, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}

	static async build(projectId: string): Promise<ServiceResponse<string>> {
		try {
			const response = await projectsClient.build({ projectId });
			const { buildId } = response;
			return { data: buildId, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}

	static async deploy(projectId: string): Promise<ServiceResponse<string>> {
		const { data: buildId } = await this.build(projectId);
		if (buildId) {
			const { data: environments } = await EnvironmentsService.listByProjectId(projectId);
			const environment = environments?.find(
				(environment) => environment.name === DEFAULT_ENVIRONMENT
			);

			if (environment) {
				const { data: deploymentId } = await DeploymentsService.create({
					buildId,
					envId: environment.envId,
				});

				return { data: deploymentId, error: undefined };
			} else {
				return { data: undefined, error: translate().t("errors.defaultEnvironmentNotFound") };
			}
		}
		return { data: undefined, error: translate().t("errors.buildFailed") };
	}

	static async run(projectId: string): Promise<ServiceResponse<ActivateResponse>> {
		const { data: deploymentId } = await this.deploy(projectId);
		if (deploymentId) {
			try {
				const { data: activateResponse } = await DeploymentsService.activate(deploymentId);
				return { data: activateResponse, error: undefined };
			} catch (error) {
				return { data: undefined, error: error };
			}
		} else {
			return { data: undefined, error: new Error(translate().t("errors.deploymentFailed")) };
		}
	}
}
