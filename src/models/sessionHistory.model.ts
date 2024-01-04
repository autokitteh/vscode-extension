import { SessionState as ProtoSessionState } from "@ak-proto-ts/sessions/v1/session_pb";
import { SessionHistory } from "@type/models";

export function convertSessionHistoryProtoToModel(
	protoSessionHistory: ProtoSessionState[] | undefined
) {
	if (!protoSessionHistory) {
		throw new Error("Session history is undefined");
	}
	return protoSessionHistory;
}
