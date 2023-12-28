import { deploymentsClient, sessionsClient } from "@api/grpc/clients.grpc.api";
import { handlegRPCErrors } from "@api/grpc/errorHandler.grpc.api";
import { convertDeploymentProtoToTS } from "@models/deployment.model";
import { Deployment } from "@type/models/deployment.type";
import get from "lodash/get";

export class DeploymentsService {
	static async listByBuildIds(buildIds: string[]): Promise<Deployment[]> {
		const deploymentsPromises = buildIds.map(async (buildId) =>
			deploymentsClient.list({ buildId })
		);
		const deploymentsResponses = await Promise.allSettled(deploymentsPromises);

		const rejectedPromises = deploymentsResponses.filter(
			(response) => response.status === "rejected"
		);
		if (rejectedPromises.length > 0) {
			throw new Error("Error fetching some deployments.");
		}

		const deployments = deploymentsResponses
			.filter((response) => response.status === "fulfilled")
			.flatMap((response) => get(response, "value.deployments", []))
			.map((deployment) => convertDeploymentProtoToTS(deployment));

		return deployments;
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
