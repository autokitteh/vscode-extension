import { Project } from "@ak-proto-ts/projects/v1/project_pb";
import { projectsClient } from "@api/grpc/clients.grpc.api";
import { handlegRPCErrors } from "@api/grpc/errorHandler.grpc.api";
import { DEFAULT_ENVIRONMENT } from "@constants/extensionConfiguration.constants";
import { translate } from "@i18n";
import { DeploymentsService, EnvironmentsService } from "@services";
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
		projectId: string
	): Promise<{ buildId: string; deploymentId: string | undefined } | undefined> {
		const buildId = await this.build(projectId);
		if (buildId) {
			const environments = await EnvironmentsService.listByProjectId(projectId);
			const environment = environments.find(
				(environment) => environment.name === DEFAULT_ENVIRONMENT
			);

			if (environment) {
				const deploymentId = await DeploymentsService.create({
					buildId,
					envId: environment.envId,
				});

				return { buildId, deploymentId };
			} else {
				MessageHandler.errorMessage(translate().t("errors.defaultEnvironmentNotFound"));
			}
		}
		return;
	}

	static async run(
		projectId: string
	): Promise<{ buildId: string; deploymentId: string | undefined } | undefined> {
		const projectDeployment = await this.deploy(projectId);
		if (projectDeployment?.deploymentId && projectDeployment?.buildId) {
			const { buildId, deploymentId } = projectDeployment;
			try {
				await DeploymentsService.activate(deploymentId);
			} catch (error) {
				handlegRPCErrors(error);
			}
			return { buildId, deploymentId };
		}
		return;
	}
}
