import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { Env } from "@ak-proto-ts/envs/v1/env_pb";
import { deploymentsClient } from "@services/services";
import { flattenArray } from "@utilities/flattenArray";
import { get } from "lodash";

export class DeploymentsService {
	static async listForEnvironments(environments: Env[]): Promise<Deployment[]> {
		const deploymentsPromises = environments.map(async (environment) => {
			const deployments = await deploymentsClient.list({
				envId: environment.envId,
			});
			return deployments;
		});

		const deploymentsResponses = await Promise.allSettled(deploymentsPromises);

		const deployments = flattenArray<Deployment>(
			deploymentsResponses
				.filter((response) => response.status === "fulfilled")
				.map((response) => get(response, "value.deployments", []))
		);

		return deployments;
	}
}
