type ConnectionStatus = {
	code: number;
	message: string;
};

export type Connection = {
	connectionId: string;
	name: string;
	initLink: string;
	status: ConnectionStatus | undefined;
	capabilities: Record<string, boolean> | undefined;
};
