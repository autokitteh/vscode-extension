import { Project } from "@ak-proto-ts/projects/v1/project_pb";
import { projectsClient } from "@api/grpc/clients";
import { handlegRPCErrors } from "@api/grpc/grpc.errorHandler";
import { translate } from "@i18n";
import { DeploymentsService } from "@services";
import { MessageHandler } from "@views";

export class ProjectsService {
	static async get(projectId: string): Promise<Project | undefined> {
		try {
			const response = await projectsClient.get({ projectId });
			return response?.project || undefined;
		} catch (error) {
			handlegRPCErrors(error);
		}
		return undefined;
	}

	static async list(userId: string): Promise<Project[]> {
		try {
			const response = await projectsClient.listForOwner({ ownerId: userId });
			return response.projects;
		} catch (error) {
			handlegRPCErrors(error);
		}
		return [];
	}

	static async build(projectId: string): Promise<string | undefined> {
		try {
			const response = await projectsClient.build({ projectId });
			const { buildId } = response;
			return buildId;
		} catch (error) {
			handlegRPCErrors(error);
		}
		return;
	}

	static async deploy(
		deployment: { envId: string; buildId: string },
		projectId: string
	): Promise<void> {
		const buildId = await this.build(projectId);
		const deploymentId = await DeploymentsService.create(deployment);
		if (buildId && deploymentId) {
			DeploymentsService.activate(deploymentId);
		}
	}
}
