import { sessionsClient } from "@api/grpc/clients.grpc.api";
import { namespaces } from "@constants";
import { translate } from "@i18n";
import { convertSessionProtoToModel } from "@models/session.model";
import { convertSessionHistoryProtoToModel } from "@models/sessionHistory.model";
import { LoggerService } from "@services";
import { EnvironmentsService } from "@services/environments.service";
import { Session, SessionHistory } from "@type/models";
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
			LoggerService.error(namespaces.sessionsService, (error as Error).message);
			return { data: undefined, error };
		}
	}

	static async listByDeploymentId(deploymentId: string): Promise<ServiceResponse<Session[]>> {
		try {
			const response = await sessionsClient.list({ deploymentId });
			const sessions = response.sessions.map((session) => convertSessionProtoToModel(session));
			return { data: sessions, error: undefined };
		} catch (error) {
			LoggerService.error(namespaces.sessionsService, (error as Error).message);

			return { data: undefined, error };
		}
	}

	static async getHistoryBySessionId(sessionId: string): Promise<ServiceResponse<SessionHistory>> {
		try {
			const response = await sessionsClient.getHistory({ sessionId });
			const sessionHistory = convertSessionHistoryProtoToModel(response.history);
			return { data: sessionHistory, error: undefined };
		} catch (error) {
			LoggerService.getInstance().error(nameSpaces.sessionsService, (error as Error).message);

			return { data: undefined, error };
		}
	}

	static async listByProjectId(projectId: string): Promise<ServiceResponse<Session[]>> {
		try {
			const { data: projectEnvironments, error: environmentsError } =
				await EnvironmentsService.listByProjectId(projectId);

			if (!environmentsError && projectEnvironments) {
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
				LoggerService.error(
					namespaces.sessionsService,
					translate().t("errors.projectEnvironmentsNotFound")
				);

				return {
					data: undefined,
					error: new Error(translate().t("errors.projectEnvironmentsNotFound")),
				};
			}
		} catch (error) {
			LoggerService.error(namespaces.sessionsService, (error as Error).message);

			return {
				data: undefined,
				error,
			};
		}
	}
}
