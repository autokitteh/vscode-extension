import { Session } from "@ak-proto-ts/sessions/v1/session_pb";
import { sessionsClient } from "@api/grpc/clients.grpc.api";
import { translate } from "@i18n";
import { EnvironmentsService } from "@services/environments.service";
import { ServiceResponse } from "@type/services.types";
import { flattenArray } from "@utilities";
import { get } from "lodash";

export class SessionsService {
	static async listByEnvironmentId(environmentId: string): ServiceResponse<Session[]> {
		try {
			const sessions = (await sessionsClient.list({ envId: environmentId })).sessions;
			return { data: sessions, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}

	static async listByProjectId(projectId: string): ServiceResponse<Session[]> {
		try {
			const { data: projectEnvironments } = await EnvironmentsService.listByProjectId(projectId);

			if (projectEnvironments) {
				const sessionsPromises = projectEnvironments.map(async (environment) => {
					const sessions = await this.listByEnvironmentId(environment.envId);
					return sessions;
				});

				const sessionsResponses = await Promise.allSettled(sessionsPromises);

				const sessions = flattenArray<Session>(
					sessionsResponses
						.filter((response) => response.status === "fulfilled")
						.map((response) => get(response, "value.sessions", []))
				);

				return { data: sessions, error: undefined };
			} else {
				return {
					data: undefined,
					error: new Error(translate().t("errors.projectEnvironmentsNotFound")),
				};
			}
		} catch (error) {
			return {
				data: undefined,
				error,
			};
		}
	}
}
