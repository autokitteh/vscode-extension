import { Project } from "@ak-proto-ts/projects/v1/project_pb";
import { projectsClient } from "@api/grpc/clients.grpc.api";
import { handlegRPCErrors } from "@api/grpc/errorHandler.grpc.api";
import { DeploymentsService } from "@services";
import { ServiceResponse } from "@type/services.types";

export class ProjectsService {
	static async get(projectId: string): ServiceResponse {
		try {
			const project = (await projectsClient.get({ projectId })).project;
			return { data: project, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}

	static async list(userId: string): ServiceResponse {
		try {
			const projects = (await projectsClient.listForOwner({ ownerId: userId })).projects;
			return { data: projects, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}

	static async build(projectId: string): ServiceResponse {
		try {
			const response = await projectsClient.build({ projectId });
			const { buildId } = response;
			return { data: buildId, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}

	static async deploy(
		deployment: { envId: string; buildId: string },
		projectId: string
	): ServiceResponse {
		let buildRequestError;
		if (!deployment.buildId) {
			const { data: buildId, error: buildError } = await this.build(projectId);
			buildRequestError = buildError;
		}
		const { data: deploymentId, error: deployError } = await DeploymentsService.create(deployment);

		const combinedErrors: {
			buildRequestError?: object;
			deployRequestError?: object;
		} = {};

		if (buildRequestError) {
			combinedErrors.buildRequestError = buildRequestError;
		}

		if (deployError) {
			combinedErrors.deployRequestError = deployError;
		}

		if (Object.keys(combinedErrors).length > 0) {
			return { data: undefined, error: combinedErrors };
		} else {
			return await DeploymentsService.activate(deploymentId as string);
		}
	}
}
