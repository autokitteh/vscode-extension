import { Status, Status_Code } from "@ak-proto-ts/common/v1/status_pb";
import { Connection as ProtoConnection } from "@ak-proto-ts/connections/v1/connection_pb";
import { Connection, ConnectionStatus } from "@type/models";

export const mapProtoStatusToConnectionStatus = (protoStatus: Status | undefined): ConnectionStatus => {
	if (!protoStatus) {
		return "unspecified";
	}

	switch (protoStatus.code) {
		case Status_Code.OK:
			return "ok";
		case Status_Code.WARNING:
			return "warning";
		case Status_Code.ERROR:
			return "error";
		case Status_Code.UNSPECIFIED:
			return "unspecified";
		default:
			return "unspecified";
	}
};

export const convertConnectionProtoToModel = (protoConnection: ProtoConnection): Connection => {
	const temporaryStatusMapping =
		protoConnection.status?.code === Status_Code.UNSPECIFIED ? Status_Code.OK : protoConnection.status?.code;
	const tempStatus = { code: temporaryStatusMapping } as Status;

	return {
		connectionId: protoConnection.connectionId,
		integrationId: protoConnection.integrationId,
		name: protoConnection.name,
		initURL: protoConnection.links?.init_url || "",
		isTestable: protoConnection.links?.test_url !== undefined,
		status: mapProtoStatusToConnectionStatus(tempStatus),
		statusInfoMessage: protoConnection.status?.message || "",
	};
};
