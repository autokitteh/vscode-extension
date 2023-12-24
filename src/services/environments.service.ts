import { Env } from "@ak-proto-ts/envs/v1/env_pb";
import { environmentsClient } from "@api/grpc/clients.grpc.api";
import { handlegRPCErrors } from "@api/grpc/errorHandler.grpc.api";
import { ServiceResponse } from "@type/services.types";
import { flattenArray } from "@utilities";
import { get } from "lodash";

export class EnvironmentsService {
	static async listForProjects(projectsIds: string[]): ServiceResponse {
		try {
			const environmentsPromises = projectsIds.map(async (projectId) => {
				const environments = await environmentsClient.list({
					parentId: projectId,
				});
				return environments;
			});

			const environmentsResponses = await Promise.allSettled(environmentsPromises);
			const environmentsSettled = flattenArray<Env>(
				environmentsResponses
					.filter((response) => response.status === "fulfilled")
					.map((response) => get(response, "value.envs", []))
			);

			// TODO: handle unsetteled responses

			return { data: environmentsSettled, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}
	static async getByProject(projectId: string): ServiceResponse {
		try {
			const environments = (
				await environmentsClient.list({
					parentId: projectId,
				})
			).envs;
			return { data: environments, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}
}
