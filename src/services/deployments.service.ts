import { deploymentsClient, sessionsClient } from "@api/grpc/clients.grpc.api";
import { handlegRPCErrors } from "@api/grpc/errorHandler.grpc.api";
import { Deployment } from "@models";
import { SessionsService } from "@services/sessions.service";
import { DeploymentType } from "@type/models/deployment.type";
import { chain } from "lodash";
import get from "lodash/get";

export class DeploymentsService {
	// static async listByEnvironmentIds(environmentsIds: string[]): Promise<DeploymentType[]> {
	// 	try {
	// 		const deploymentsPromises = environmentsIds.map(
	// 			async (envId) =>
	// 				await deploymentsClient.list({
	// 					envId,
	// 				})
	// 		);

	// 		const deploymentsResponses = await Promise.allSettled(deploymentsPromises);

	// 		const deployments = chain(deploymentsResponses)
	// 			.filter((response) => response.status === "fulfilled")
	// 			.flatMap((response) => get(response, "value.deployments", []))
	// 			.value();

	// 		const deploymentsSessions = deployments.map((deployment) => {
	// 			deployment.sessions = sessionsClient.listByDeploymentId(deployment.deploymentId);
	// 		});

	// 		return deployments;
	// 	} catch (error) {
	// 		handlegRPCErrors(error);
	// 	}
	// 	return [];
	// }

	static async listByBuildIds(buildIds: string[]): Promise<DeploymentType[]> {
		// Fetch deployments in parallel
		const deploymentsPromises = buildIds.map(async (buildId) =>
			deploymentsClient.list({ buildId })
		);
		const deploymentsResponses = await Promise.allSettled(deploymentsPromises);

		// Check for any rejected promises and throw an error if found
		const rejectedPromises = deploymentsResponses.filter(
			(response) => response.status === "rejected"
		);
		if (rejectedPromises.length > 0) {
			throw new Error("Error fetching some deployments.");
		}

		// Filter and flatten deployments
		const deployments = deploymentsResponses
			.filter((response) => response.status === "fulfilled")
			.flatMap((response) => get(response, "value.deployments", []))
			.map((deployment) => Deployment(deployment));

		// Fetch sessions for each deployment in parallel and enrich deployments
		const enrichedDeployments = await Promise.all(
			deployments.map(async (deployment) => {
				const sessions = await SessionsService.listByDeploymentId(deployment.deploymentId).catch(
					() => []
				);
				return { ...deployment, sessions };
			})
		);

		return enrichedDeployments;
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
