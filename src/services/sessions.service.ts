import {
	SessionLogRecord as ProtoSessionLogRecord,
	Session as ProtoSession,
	SessionLogRecord_Type,
} from "@ak-proto-ts/sessions/v1/session_pb";
import { StartRequest } from "@ak-proto-ts/sessions/v1/svc_pb";
import { sessionsClient } from "@api/grpc/clients.grpc.api";
import { DEFAULT_SESSIONS_VISIBLE_PAGE_SIZE, MAX_INT32_VALUE, namespaces } from "@constants";
import { translate } from "@i18n";
import { SessionOutputLog } from "@interfaces";
import { SessionLogRecord, convertSessionLogProtoToModel, convertSessionProtoToModel } from "@models";
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

	static async getOutputsBySessionId(sessionId: string): Promise<ServiceResponse<SessionOutputLog[]>> {
		const { prints } = await sessionsClient.getPrints({ sessionId, pageSize: MAX_INT32_VALUE });
		const processedPrints = prints?.map((print) => convertSessionLogProtoToModel(print)) || [];
		return {
			data: processedPrints,
			error: undefined,
		};
	}

	static async getLogRecordsBySessionId(sessionId: string): Promise<ServiceResponse<Array<SessionLogRecord>>> {
		try {
			const response = await sessionsClient.getLog({
				sessionId,
				pageSize: MAX_INT32_VALUE,
				types: SessionLogRecord_Type.STATE,
			});
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
			const sessionToStart = { ...omit(startSessionArgs, ["jsonInputs"]), projectId };

			const sessionAsStartRequest = {
				session: sessionToStart,
				jsonInputs: Object.fromEntries(
					Object.entries(startSessionArgs?.jsonInputs || {}).map(([key, value]) => [key, `"${value}"`])
				),
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
