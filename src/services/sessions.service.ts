import { SessionHistory } from "@ak-proto-ts/sessions/v1/session_pb";
import { sessionsClient } from "@api/grpc/clients.grpc.api";
import { translate } from "@i18n";
import { convertSessionProtoToModel } from "@models/session.model";
import { EnvironmentsService } from "@services/environments.service";
import { Session } from "@type/models";
import { ServiceResponse } from "@type/services.types";
import { flattenArray } from "@utilities";
import { get } from "lodash";

export class SessionsService {
	static async listByEnvironmentId(environmentId: string): Promise<ServiceResponse<Session[]>> {
		try {
			const response = await sessionsClient.list({ envId: environmentId });
			const sessions = response.sessions.map(convertSessionProtoToModel);
			return { data: sessions, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}

	static async listByDeploymentId(deploymentId: string): Promise<ServiceResponse<Session[]>> {
		try {
			const response = await sessionsClient.list({ deploymentId });
			const sessions = response.sessions.map((session) => convertSessionProtoToModel(session));
			return { data: sessions, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}

	static async getHistory(sessionId: string): Promise<ServiceResponse<SessionHistory[]>> {
		try {
			const response = await sessionsClient.getHistory({ sessionId });
			console.log("response history", response);

			return { data: [], error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}

	static async listByProjectId(projectId: string): Promise<ServiceResponse<Session[]>> {
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
						.map((response) =>
							get(response, "value.sessions", []).map((session) =>
								convertSessionProtoToModel(session)
							)
						)
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
