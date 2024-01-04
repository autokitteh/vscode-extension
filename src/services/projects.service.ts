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

	static async list(): Promise<ServiceResponse<Project[]>> {
		try {
			const projects = (await projectsClient.listForOwner({ ownerId: "" })).projects.map(
				convertProjectProtoToModel
			);
			return { data: projects, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}

	static async build(projectId: string): Promise<ServiceResponse<string>> {
		const response = await projectsClient.build({ projectId });
		const { buildId, error } = response;
		return { data: buildId, error: error };
	}

	static async deploy(projectId: string): Promise<ServiceResponse<string>> {
		const { data: buildId, error: buildError } = await this.build(projectId);
		if (buildError) {
			return { data: undefined, error: buildError };
		}
		const { data: environments, error: envError } =
			await EnvironmentsService.listByProjectId(projectId);
		if (envError) {
			return { data: undefined, error: envError };
		}

		const environment = environments![0];

		if (environment && buildId) {
			const { data: deploymentId, error } = await DeploymentsService.create({
				buildId,
				envId: environment.envId,
			});

			return { data: deploymentId, error: error };
		} else {
			return { data: undefined, error: translate().t("errors.defaultEnvironmentNotFound") };
		}
	}

	static async run(projectId: string): Promise<ServiceResponse<ActivateResponse>> {
		const { data: deploymentId } = await this.deploy(projectId);
		if (deploymentId) {
			try {
				const { data: activateResponse, error } = await DeploymentsService.activate(deploymentId);
				return { data: activateResponse, error: error };
			} catch (error) {
				return { data: undefined, error: error };
			}
		} else {
			return { data: undefined, error: new Error(translate().t("errors.deploymentFailed")) };
		}
	}
}
