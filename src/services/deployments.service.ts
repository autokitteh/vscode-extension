import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { deploymentsClient } from "@api/grpc/clients";
import { flattenArray } from "@utilities";
import { get } from "lodash";

export class DeploymentsService {
	static async listForEnvironments(environmentsIds: string[]): Promise<Deployment[]> {
		const deploymentsPromises = environmentsIds.map(
			async (envId) =>
				await deploymentsClient.list({
					envId,
				})
		);

		const deploymentsResponses = await Promise.allSettled(deploymentsPromises);

		const deployments = flattenArray<Deployment>(
			deploymentsResponses
				.filter((response) => response.status === "fulfilled")
				.map((response) => get(response, "value.deployments", []))
		);

		return deployments;
	}
}
