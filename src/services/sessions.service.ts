import { Session } from "@ak-proto-ts/sessions/v1/session_pb";
import { sessionsClient } from "@api/grpc/clients.grpc.api";
import { handlegRPCErrors } from "@api/grpc/errorHandler.grpc.api";
import { EnvironmentsService } from "@services/environments.service";
import { flattenArray } from "@utilities";
import { get } from "lodash";

export class SessionsService {
	static async listByEnvironmentId(environmentId: string): Promise<Session[]> {
		try {
			return (await sessionsClient.list({ envId: environmentId })).sessions;
		} catch (error) {
			handlegRPCErrors(error);
		}
		return [];
	}

	static async listByProjectId(projectId: string): Promise<Session[]> {
		try {
			const projectEnvironments = await EnvironmentsService.listByProjectId(projectId);

			const sessionsPromises = projectEnvironments.map(async (environment) => {
				const sessions = await this.listByEnvironmentId(environment.envId);
				return sessions;
			});

			const sessionsResponses = await Promise.allSettled(sessionsPromises);

			return flattenArray<Session>(
				sessionsResponses
					.filter((response) => response.status === "fulfilled")
					.map((response) => get(response, "value", []))
			);
		} catch (error) {
			handlegRPCErrors(error);
		}
		return [];
	}
}
