export type Connection = {
	connectionId: string;
	name: string;
	initURL: string;
	isTestable: boolean;
	integrationId?: string;
	integrationName?: string;
	status: ConnectionStatus;
	statusInfoMessage: string;
};

export type ConnectionStatus = "unspecified" | "warning" | "error" | "ok";
