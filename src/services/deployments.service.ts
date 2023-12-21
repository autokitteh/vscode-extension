import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { deploymentsClient } from "@api/grpc/clients";
import { handlegRPCErrors } from "@api/grpc/grpc.errorHandler";
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
}
