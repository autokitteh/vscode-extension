import { Session as ProtoSession, SessionLogRecord, SessionLogRecord_Type } from "@ak-proto-ts/sessions/v1/session_pb";
import { StartRequest } from "@ak-proto-ts/sessions/v1/svc_pb";
import { sessionsClient } from "@api/grpc/clients.grpc.api";
import { DEFAULT_SESSIONS_VISIBLE_PAGE_SIZE, SESSIONS_LOGS_PAGE_SIZE, namespaces } from "@constants";
import { translate } from "@i18n";
import { SessionOutputLog } from "@interfaces";
import { convertSessionLogProtoToModel, convertSessionProtoToModel } from "@models";
import { LoggerService } from "@services";
import { ServiceResponse, StartSessionArgsType } from "@type";
import { Session, SessionFilter } from "@type/models";
import { omit } from "@utilities/omit.utils";

export class SessionsService {
	static async listByDeploymentId(
		deploymentId: string,
		filter: SessionFilter,
		pageToken?: string
	): Promise<ServiceResponse<{ sessions: Session[]; nextPageToken: string }>> {
		try {
			const { sessions: sessionsResponse, nextPageToken } = await sessionsClient.list({
				deploymentId,
				stateType: filter.stateType,
				pageToken,
				pageSize: DEFAULT_SESSIONS_VISIBLE_PAGE_SIZE,
			});
			const sessions = sessionsResponse.map((session: ProtoSession) => convertSessionProtoToModel(session));
			return { data: { sessions, nextPageToken }, error: undefined };
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

	static async getOutputsBySessionId(
		sessionId: string,
		nextPageToken?: string
	): Promise<ServiceResponse<{ outputs: SessionOutputLog[]; nextPageToken?: string }>> {
		const { prints, nextPageToken: newNextPageToken } = await sessionsClient.getPrints({
			sessionId,
			pageSize: SESSIONS_LOGS_PAGE_SIZE,
			pageToken: nextPageToken,
		});
		const processedPrints = prints?.map(convertSessionLogProtoToModel) || [];
		return {
			data: { outputs: processedPrints, nextPageToken: newNextPageToken },
			error: undefined,
		};
	}

	static async getLogRecordsBySessionId(sessionId: string): Promise<ServiceResponse<Array<SessionLogRecord>>> {
		try {
			const response = await sessionsClient.getLog({
				sessionId,
				pageSize: SESSIONS_LOGS_PAGE_SIZE,
				jsonValues: true,
				ascending: false,
				types: SessionLogRecord_Type.STATE,
			});

			const logRecords = (response as any)?.log?.records;
			const directRecords = response.records;

			const records = logRecords || directRecords || [];

			return { data: records, error: undefined };
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
			const sessionToStart = { ...omit(startSessionArgs, ["jsonInputs"]), projectId };

			const sessionAsStartRequest = {
				session: sessionToStart,
				jsonObjectInput: JSON.stringify(startSessionArgs?.jsonInputs || {}),
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
