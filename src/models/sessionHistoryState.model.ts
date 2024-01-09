import { SessionState } from "@models";
import { ProtoSessionHistoryState } from "@type/models";

export function convertSessionHistoryStatesProtoToModel(
	protoSessionHistoryState?: Array<ProtoSessionHistoryState>
): Array<SessionState> | undefined {
	if (!protoSessionHistoryState) {
		return;
	}

	return protoSessionHistoryState.map((state) => new SessionState(state));
}
