import { Env } from "@ak-proto-ts/envs/v1/env_pb";
import { Session } from "@ak-proto-ts/sessions/v1/session_pb";
import { sessionsClient } from "@api/grpc/clients.grpc.api";
import { EnvironmentsService } from "@services/environments.service";
import { ServiceResponse } from "@type/services.types";
import { flattenArray } from "@utilities";
import { get } from "lodash";

export class SessionsService {
	static async listByEnvironmentId(environmentId: string): ServiceResponse {
		try {
			const sessions = (await sessionsClient.list({ envId: environmentId })).sessions;
			return { data: sessions, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}

	static async listByProjectId(projectId: string): ServiceResponse {
		try {
			const projectEnvironments = await EnvironmentsService.getByProject(projectId);

			const sessionsPromises = (projectEnvironments as unknown as Env[]).map(
				async (environment) => {
					const sessions = await this.listByEnvironmentId(environment.envId);
					return sessions;
				}
			);

			const sessionsResponses = await Promise.allSettled(sessionsPromises);

			const sessionsSettled = flattenArray<Session>(
				sessionsResponses
					.filter((response) => response.status === "fulfilled")
					.map((response) => get(response, "value.sessions", []))
			);
			return { data: sessionsSettled, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}
}
