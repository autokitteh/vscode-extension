import { Env } from "@ak-proto-ts/envs/v1/env_pb";
import { environmentsClient } from "@api/grpc/clients";
import { flattenArray } from "@utilities/flattenArray";
import { get } from "lodash";

export class EnvironmentsService {
	static async listForProjects(projectsIds: string[]): Promise<Env[]> {
		const environmentsPromises = projectsIds.map(async (projectId) => {
			const environments = await environmentsClient.list({
				parentId: projectId,
			});
			return environments;
		});

		const environmentsResponses = await Promise.allSettled(environmentsPromises);

		return flattenArray<Env>(
			environmentsResponses
				.filter((response) => response.status === "fulfilled")
				.map((response) => get(response, "value.envs", []))
		);
	}
}
