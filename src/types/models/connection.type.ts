export type Connection = {
	connectionId: string;
	name: string;
	initURL: string;
	integrationId?: string;
	integrationName?: string;
	status: ConnectionStatus;
	statusInfoMessage: string;
};

export type ConnectionStatus = "warning" | "error" | "ok";
