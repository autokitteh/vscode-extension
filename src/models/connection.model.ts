import { Status, Status_Code } from "@ak-proto-ts/common/v1/status_pb";
import { Connection as ProtoConnection } from "@ak-proto-ts/connections/v1/connection_pb";
import { Connection, ConnectionStatus } from "@type/models";

const mapProtoStatusToConnectionStatus = (protoStatus: Status | undefined): ConnectionStatus => {
	if (!protoStatus) {
		return "ok"; // default to ok if no status is provided, as if it was unspecified
	}

	const temporaryStatusMapping = protoStatus.code === Status_Code.UNSPECIFIED ? Status_Code.OK : protoStatus.code;

	switch (temporaryStatusMapping) {
		case Status_Code.OK:
			return "ok";
		case Status_Code.WARNING:
			return "warning";
		case Status_Code.ERROR:
			return "error";
	}
};

export const convertConnectionProtoToModel = (protoConnection: ProtoConnection): Connection => {
	return {
		connectionId: protoConnection.connectionId,
		integrationId: protoConnection.integrationId,
		name: protoConnection.name,
		initURL: protoConnection.links?.init_url || "",
		isTestable: protoConnection.links?.test_url !== undefined,
		status: mapProtoStatusToConnectionStatus(protoConnection.status),
		statusInfoMessage: protoConnection.status?.message || "",
	};
};
