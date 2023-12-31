import { ActivateResponse, ListResponse } from "@ak-proto-ts/deployments/v1/svc_pb";
import { deploymentsClient } from "@api/grpc/clients.grpc.api";
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
					.map((response) => get(response, "value.deployments", []))
			);

			const unsettledResponses = deploymentsResponses
				.filter((response): response is PromiseRejectedResult => response.status === "rejected")
				.map((response) => response.reason);

			return {
				data: deploymentsSettled,
				error: unsettledResponses.length > 0 ? unsettledResponses : undefined,
			};
		} catch (error) {
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
			return { data: undefined, error };
		}
	}
	static async activate(deploymentId: string): Promise<ServiceResponse<ActivateResponse>> {
		try {
			return { data: await deploymentsClient.activate({ deploymentId }), error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}
}
