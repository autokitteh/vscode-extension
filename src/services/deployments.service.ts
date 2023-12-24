import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { ActivateResponse } from "@ak-proto-ts/deployments/v1/svc_pb";
import { deploymentsClient } from "@api/grpc/clients.grpc.api";
import { ServiceResponse } from "@type/services.types";
import { flattenArray } from "@utilities";
import { get } from "lodash";

export class DeploymentsService {
	static async listByEnvironmentIds(environmentsIds: string[]): ServiceResponse<Deployment[]> {
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
					.filter((response) => response.status === "fulfilled")
					.map((response) => get(response, "value.deployments", []))
			);

			// TODO: handle unsetteled responses

			return {
				data: deploymentsSettled,
				error: undefined,
			};
		} catch (error) {
			return { data: undefined, error };
		}
	}
	static async create(deployment: { envId: string; buildId: string }): ServiceResponse<string> {
		try {
			const createResponse = await deploymentsClient.create({ deployment });

			return { data: createResponse.deploymentId, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}
	static async activate(deploymentId: string): ServiceResponse<ActivateResponse> {
		try {
			return { data: await deploymentsClient.activate({ deploymentId }), error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}
}
