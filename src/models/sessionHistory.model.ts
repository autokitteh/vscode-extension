import { SessionHistory as ProtoSessionHistory } from "@ak-proto-ts/sessions/v1/session_pb";
import { SessionHistory } from "@type/models";

/**
 * Converts a ProtoSession object to a SessionType object.
 * @param protoSession The ProtoSession object to convert.
 * @returns The SessionType object.
 */
export function convertSessionHistoryProtoToModel(
	ProtoSessionHistory?: ProtoSessionHistory
): SessionHistory {
	return {
		states: ProtoSessionHistory?.states || undefined,
	};
}
