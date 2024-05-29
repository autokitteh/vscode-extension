import { Status, Status_Code } from "@ak-proto-ts/common/v1/status_pb";
import { Connection as ProtoConnection } from "@ak-proto-ts/connections/v1/connection_pb";

// Define ConnectionStatus type
export type ConnectionStatus = "unspecified" | "warning" | "error" | "ok";

// Define Connection type
export type Connection = {
	connectionId: string;
	name: string;
	initURL: string;
	integrationId?: string;
	integrationName?: string;
	status: ConnectionStatus;
	statusInfoMessage: string;
};

export const mapProtoStatusToConnectionStatus = (protoStatus: Status | undefined): ConnectionStatus => {
	if (!protoStatus) {
		return "ok";
	}

	switch (protoStatus.code) {
		case Status_Code.OK:
			return "ok";
		case Status_Code.WARNING:
			return "warning";
		case Status_Code.ERROR:
			return "error";
		case Status_Code.UNSPECIFIED:
			return "ok";
		default:
			return "unspecified";
	}
};

// Convert function
export const convertConnectionProtoToModel = (protoConnection: ProtoConnection): Connection => {
	return {
		connectionId: protoConnection.connectionId,
		integrationId: protoConnection.integrationId,
		name: protoConnection.name,
		initURL: protoConnection.links?.init_url || "",
		status: mapProtoStatusToConnectionStatus(protoConnection.status),
		statusInfoMessage: protoConnection.status?.message || "",
	};
};
