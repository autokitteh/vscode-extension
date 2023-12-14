import { Env } from "@ak-proto-ts/envs/v1/env_pb";
import { Project } from "@ak-proto-ts/projects/v1/project_pb";
import { environmentsClient } from "@services/services";
import { flattenArray } from "@utilities/flattenArray";
import { get } from "lodash";

export class EnvironmentService {
	static async listForProjects(projects: Project[]): Promise<Env[]> {
		const environmentsPromises = projects.map(async (project) => {
			const environments = await environmentsClient.list({
				parentId: project.projectId,
			});
			return environments;
		});

		const environmentsResponses = await Promise.allSettled(environmentsPromises);

		const environments = flattenArray<Env>(
			environmentsResponses
				.filter((response) => response.status === "fulfilled")
				.map((response) => get(response, "value.envs", []))
		);

		return environments;
	}
}
