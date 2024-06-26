import { ActivateResponse, ListResponse } from "@ak-proto-ts/deployments/v1/svc_pb";
import { deploymentsClient } from "@api/grpc/clients.grpc.api";
import { namespaces } from "@constants";
import { SortOrder } from "@enums";
import { translate } from "@i18n";
import { convertDeploymentProtoToModel } from "@models";
import { EnvironmentsService, LoggerService } from "@services";
import { ServiceResponse } from "@type";
import { Deployment } from "@type/models";
import { flattenArray, getIds, sortArray } from "@utilities";

export class DeploymentsService {
	static async listByEnvironmentIds(environmentsIds: string[]): Promise<ServiceResponse<Deployment[]>> {
		try {
			const deploymentsPromises = environmentsIds.map(
				async (envId) =>
					await deploymentsClient.list({
						envId,
						includeSessionStats: true,
					})
			);

			const deploymentsResponses = await Promise.allSettled(deploymentsPromises);
			const deploymentsSettled = flattenArray<Deployment>(
				deploymentsResponses
					.filter((response): response is PromiseFulfilledResult<ListResponse> => response.status === "fulfilled")
					.map((response) => (response?.value.deployments || []).map(convertDeploymentProtoToModel))
			);

			const unsettledResponses = deploymentsResponses
				.filter((response): response is PromiseRejectedResult => response.status === "rejected")
				.map((response) => response.reason);

			return {
				data: deploymentsSettled,
				error: unsettledResponses.length > 0 ? unsettledResponses : undefined,
			};
		} catch (error) {
			LoggerService.error(namespaces.deploymentsService, (error as Error).message);

			return { data: undefined, error };
		}
	}

	static async listByProjectId(projectId: string): Promise<ServiceResponse<Deployment[]>> {
		try {
			const { data: environments, error: listEnvironmentsError } = await EnvironmentsService.listByProjectId(projectId);

			if (listEnvironmentsError) {
				LoggerService.error(namespaces.deploymentsService, (listEnvironmentsError as Error).message);

				return { data: undefined, error: listEnvironmentsError };
			}

			const environmentIds = getIds(environments!, "envId");
			const { data: projectDeployments, error: listDeploymentsError } = await this.listByEnvironmentIds(environmentIds);

			if (listDeploymentsError) {
				LoggerService.error(namespaces.deploymentsService, (listDeploymentsError as Error).message);

				return { data: undefined, error: listDeploymentsError };
			}
			sortArray(projectDeployments, "createdAt", SortOrder.DESC);

			return { data: projectDeployments!, error: undefined };
		} catch (error) {
			LoggerService.error(namespaces.deploymentsService, (error as Error).message);
			return { data: undefined, error: (error as Error).message };
		}
	}

	static async create(deployment: { envId: string; buildId: string }): Promise<ServiceResponse<string>> {
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
