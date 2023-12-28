import { Session as ProtoSession } from "@ak-proto-ts/sessions/v1/session_pb";
import { Session } from "@type/models/session.type";
import { convertTimestampToDate } from "@utilities/convertTimestampToDate";
import { pick } from "@utilities/pick";

/**
 * Converts a ProtoSession object to a SessionType object.
 * @param protoSession The ProtoSession object to convert.
 * @returns The SessionType object.
 */
export function convertSessionProtoToTS(protoSession: ProtoSession): Session {
	return {
		sessionId: protoSession.sessionId,
		deploymentId: protoSession.deploymentId,
		createdAt: convertTimestampToDate(protoSession.createdAt),
	};
}
