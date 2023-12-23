import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { deploymentsClient } from "@api/grpc/clients.api";
import { handlegRPCErrors } from "@api/grpc/grpc.errorHandler.api";
import { flattenArray } from "@utilities";
import { get } from "lodash";

export class DeploymentsService {
	static async listForEnvironments(environmentsIds: string[]): Promise<Deployment[]> {
		try {
			const deploymentsPromises = environmentsIds.map(
				async (envId) =>
					await deploymentsClient.list({
						envId,
					})
			);

			const deploymentsResponses = await Promise.allSettled(deploymentsPromises);

			return flattenArray<Deployment>(
				deploymentsResponses
					.filter((response) => response.status === "fulfilled")
					.map((response) => get(response, "value.deployments", []))
			);
		} catch (error) {
			handlegRPCErrors(error);
		}
		return [];
	}
	static async create(deployment: { envId: string; buildId: string }): Promise<string | undefined> {
		try {
			const createResponse = await deploymentsClient.create({ deployment });

			return createResponse.deploymentId;
		} catch (error) {
			handlegRPCErrors(error);
		}
		return undefined;
	}
	static async activate(deploymentId: string): Promise<void> {
		try {
			await deploymentsClient.activate({ deploymentId });
		} catch (error) {
			handlegRPCErrors(error);
		}
	}
}
