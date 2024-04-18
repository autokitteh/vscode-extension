import {
	SessionLogRecord as ProtoSessionLogRecord,
	Session as ProtoSession,
} from "@ak-proto-ts/sessions/v1/session_pb";
import { StartRequest } from "@ak-proto-ts/sessions/v1/svc_pb";
import { sessionsClient } from "@api/grpc/clients.grpc.api";
import { namespaces } from "@constants";
import { translate } from "@i18n";
import { SessionLogRecord, convertSessionProtoToModel } from "@models";
import { EnvironmentsService, LoggerService } from "@services";
import { ServiceResponse, StartSessionArgsType } from "@type";
import { Session, SessionFilter } from "@type/models";

export class SessionsService {
	static async listByEnvironmentId(environmentId: string): Promise<ServiceResponse<Session[]>> {
		try {
			const { sessions: sessionsResponse } = await sessionsClient.list({ envId: environmentId });
			const sessions = sessionsResponse.map(convertSessionProtoToModel);
			return { data: sessions, error: undefined };
		} catch (error) {
			LoggerService.error(namespaces.sessionsService, (error as Error).message);
			return { data: undefined, error };
		}
	}

	static async listByDeploymentId(deploymentId: string, filter: SessionFilter): Promise<ServiceResponse<Session[]>> {
		try {
			const { sessions: sessionsResponse } = await sessionsClient.list({
				deploymentId,
				stateType: filter.stateType,
			});
			const sessions = sessionsResponse.map((session: ProtoSession) => convertSessionProtoToModel(session));
			return { data: sessions, error: undefined };
		} catch (error) {
			LoggerService.error(namespaces.sessionsService, (error as Error).message);

			return { data: undefined, error };
		}
	}

	static async stop(sessionId: string): Promise<ServiceResponse<undefined>> {
		try {
			await sessionsClient.stop({ sessionId });

			return { data: undefined, error: undefined };
		} catch (error) {
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

	static async startSession(
		startSessionArgs: StartSessionArgsType,
		projectId: string
	): Promise<ServiceResponse<string>> {
		try {
			const { data: environments, error: envError } = await EnvironmentsService.listByProjectId(projectId);
			if (envError) {
				return { data: undefined, error: envError };
			}

			if (!environments?.length) {
				const errorMessage = translate().t("errors.defaultEnvironmentNotFound");
				LoggerService.error(namespaces.projectService, errorMessage);
				return { data: undefined, error: new Error(errorMessage) };
			}

			const environment = environments[0];

			const sessionAsStartRequest = {
				session: { ...startSessionArgs, envId: environment.envId },
			} as unknown as StartRequest;
			const { sessionId } = await sessionsClient.start(sessionAsStartRequest);
			return { data: sessionId, error: undefined };
		} catch (error) {
			const log = translate().t("errors.sessionStartFailedExtended", { error, buildId: startSessionArgs.buildId });
			LoggerService.error(namespaces.sessionsService, log);
			return { data: undefined, error: log };
		}
	}

	static async deleteSession(sessionId: string): Promise<ServiceResponse<void>> {
		try {
			await sessionsClient.delete({ sessionId });
			return { data: undefined, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}
}
