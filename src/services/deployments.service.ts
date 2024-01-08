import { ActivateResponse, ListResponse } from "@ak-proto-ts/deployments/v1/svc_pb";
import { deploymentsClient } from "@api/grpc/clients.grpc.api";
import { namespaces } from "@constants";
import { convertDeploymentProtoToModel } from "@models/deployment.model";
import { LoggerService } from "@services/logger.service";
import { Deployment } from "@type/models";
import { ServiceResponse } from "@type/services.types";
import { flattenArray } from "@utilities";
import { get } from "lodash";

export class DeploymentsService {
	static async listByEnvironmentIds(
		environmentsIds: string[]
	): Promise<ServiceResponse<Deployment[]>> {
		try {
			const deploymentsPromises = environmentsIds.map(
				async (envId) =>
					await deploymentsClient.list({
						envId,
					})
			);

			const deploymentsResponses = await Promise.allSettled(deploymentsPromises);
			const deploymentsSettled = flattenArray<Deployment>(
				deploymentsResponses
					.filter(
						(response): response is PromiseFulfilledResult<ListResponse> =>
							response.status === "fulfilled"
					)
					.map((response) =>
						get(response, "value.deployments", []).map(convertDeploymentProtoToModel)
					)
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
	static async create(deployment: {
		envId: string;
		buildId: string;
	}): Promise<ServiceResponse<string>> {
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
}
