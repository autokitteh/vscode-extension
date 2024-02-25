import { error } from "console";
import {
	Session as ProtoSession,
	SessionLogRecord as ProtoSessionLogRecord,
} from "@ak-proto-ts/sessions/v1/session_pb";
import { StartRequest } from "@ak-proto-ts/sessions/v1/svc_pb";
import { sessionsClient } from "@api/grpc/clients.grpc.api";
import { namespaces } from "@constants";
import { SessionLogRecord, convertSessionProtoToModel } from "@models";
import { EnvironmentsService, LoggerService } from "@services";
import { ServiceResponse } from "@type";
import { Session } from "@type/models";
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
			const sessions = response.sessions.map((session: ProtoSession) => convertSessionProtoToModel(session));
			return { data: sessions, error: undefined };
		} catch (error) {
			LoggerService.error(namespaces.sessionsService, (error as Error).message);

			return { data: undefined, error };
		}
	}

	static async getLogRecordsBySessionId(sessionId: string): Promise<ServiceResponse<Array<SessionLogRecord>>> {
		try {
			const response = await sessionsClient.getLog({ sessionId });
			const sessionHistory = response.log?.records.map((state: ProtoSessionLogRecord) => new SessionLogRecord(state));
			return { data: sessionHistory, error: undefined };
		} catch (error) {
			LoggerService.error(namespaces.sessionsService, (error as Error).message);

			return { data: undefined, error };
		}
	}

	static async runSingleShot(deploymentId: string): Promise<void> {
		try {
			const newSession = {
				deploymentId,
				envId: "",
				inputs: {},
				entrypoint: {
					col: 0,
					row: 0,
					name: "on_http_get",
					path: "http.star",
				},
			};
			const response = await sessionsClient.start({ session: newSession } as unknown as StartRequest);
			console.log(response);
		} catch (error) {
			LoggerService.error(namespaces.sessionsService, (error as Error).message);
		}
	}

	static async listByProjectId(projectId: string): Promise<ServiceResponse<Session[]>> {
		try {
			const { data: projectEnvironments, error: environmentsError } =
				await EnvironmentsService.listByProjectId(projectId);

			if (environmentsError) {
				LoggerService.error(namespaces.sessionsService, (environmentsError as Error).message);

				return { data: undefined, error };
			}
			const sessionsPromises = (projectEnvironments || []).map(async (environment) => {
				const sessions = await this.listByEnvironmentId(environment.envId);
				return sessions;
			});

			const sessionsResponses = await Promise.allSettled(sessionsPromises);

			const sessions = flattenArray<Session>(
				sessionsResponses
					.filter((response) => response.status === "fulfilled")
					.map((response) => get(response, "value.sessions", []).map((session) => convertSessionProtoToModel(session)))
			);

			return { data: sessions, error: undefined };
		} catch (error) {
			LoggerService.error(namespaces.sessionsService, (error as Error).message);

			return {
				data: undefined,
				error,
			};
		}
	}
}
