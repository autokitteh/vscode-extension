import { SessionHistory as ProtoSessionHistory } from "@ak-proto-ts/sessions/v1/session_pb";
import { SessionHistory } from "@type/models";

export function convertSessionHistoryProtoToModel(
	ProtoSessionHistory?: ProtoSessionHistory
): SessionHistory {
	return {
		states: ProtoSessionHistory?.states || undefined,
	};
}
