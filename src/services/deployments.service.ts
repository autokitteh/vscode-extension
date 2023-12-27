import { deploymentsClient } from "@api/grpc/clients.grpc.api";
import { handlegRPCErrors } from "@api/grpc/errorHandler.grpc.api";
import { Deployment } from "@models";
import { chain } from "lodash";
import get from "lodash/get";

export class DeploymentsService {
	static async listByEnvironmentIds(environmentsIds: string[]): Promise<Deployment[]> {
		try {
			const deploymentsPromises = environmentsIds.map(
				async (envId) =>
					await deploymentsClient.list({
						envId,
					})
			);

			const deploymentsResponses = await Promise.allSettled(deploymentsPromises);

			const deployments = chain(deploymentsResponses)
				.filter((response) => response.status === "fulfilled")
				.flatMap((response) => get(response, "value.deployments", []))
				.map((deployment) => new Deployment(deployment))
				.value();

			return deployments;
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
