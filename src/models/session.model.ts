import { Session as ProtoSession } from "@ak-proto-ts/sessions/v1/session_pb";
import { SessionType } from "@type/models/session.type";
import { convertTimestampToDate } from "@utilities/convertTimestampToDate";
import { pick } from "@utilities/pick";

/**
 * Converts a ProtoSession object to a SessionType object.
 * @param protoSession The ProtoSession object to convert.
 * @returns The SessionType object.
 */
export function Session(protoSession: ProtoSession): SessionType {
	const session = pick(protoSession, ["sessionId", "deploymentId"]);
	const sessionCreatedAt = convertTimestampToDate(protoSession.createdAt);
	return { ...session, createdAt: sessionCreatedAt } as SessionType;
}
