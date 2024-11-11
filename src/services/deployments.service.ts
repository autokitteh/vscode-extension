import { ActivateResponse } from "@ak-proto-ts/deployments/v1/svc_pb";
import { deploymentsClient } from "@api/grpc/clients.grpc.api";
import { namespaces } from "@constants";
import { SortOrder } from "@enums";
import { translate } from "@i18n";
import { convertDeploymentProtoToModel } from "@models";
import { LoggerService } from "@services";
import { ServiceResponse } from "@type";
import { Deployment } from "@type/models";
import { sortArray } from "@utilities";

export class DeploymentsService {
	static async listByProjectId(projectId: string): Promise<ServiceResponse<Deployment[]>> {
		try {
			const { deployments } = await deploymentsClient.list({
				projectId,
				includeSessionStats: true,
			});
			const projectDeployments = deployments.map(convertDeploymentProtoToModel);
			sortArray(projectDeployments, "createdAt", SortOrder.DESC);

			return { data: projectDeployments!, error: undefined };
		} catch (error) {
			LoggerService.error(namespaces.deploymentsService, (error as Error).message);
			return { data: undefined, error: (error as Error).message };
		}
	}

	static async create(deployment: { projectId: string; buildId: string }): Promise<ServiceResponse<string>> {
		try {
			const createResponse = await deploymentsClient.create({ deployment });

			return { data: createResponse.deploymentId, error: undefined };
		} catch (error) {
			LoggerService.error(namespaces.deploymentsService, (error as Error).message);
			return { data: undefined, error };
		}
	}

	static async activate(deploymentId: string): Promise<ServiceResponse<ActivateResponse>> {
		try {
			const activateResponse = await deploymentsClient.activate({ deploymentId });
			return { data: activateResponse, error: undefined };
		} catch (error) {
			LoggerService.error(namespaces.deploymentsService, (error as Error).message);
			return { data: undefined, error };
		}
	}

	static async deactivate(deploymentId: string): Promise<ServiceResponse<ActivateResponse>> {
		try {
			const deactivateResponse = await deploymentsClient.deactivate({ deploymentId });
			return { data: deactivateResponse, error: undefined };
		} catch (error) {
			LoggerService.error(namespaces.deploymentsService, (error as Error).message);
			return { data: undefined, error };
		}
	}

	static async delete(deploymentId: string): Promise<ServiceResponse<undefined>> {
		try {
			await deploymentsClient.delete({ deploymentId });
			return { data: undefined, error: undefined };
		} catch (error) {
			const errorMessage = translate().t("deployments.deleteFailedIdError", {
				deploymentId,
				error: (error as Error).message,
			});
			LoggerService.error(namespaces.deploymentsService, errorMessage);

			return { data: undefined, error };
		}
	}
}
