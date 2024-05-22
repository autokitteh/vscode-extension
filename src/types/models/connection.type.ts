type ConnectionStatus = {
	code: number;
	message: string;
};

export type Connection = {
	connectionId: string;
	name: string;
	links: Record<string, string>;
	status: ConnectionStatus | undefined;
	capabilities: Record<string, boolean> | undefined;
};
