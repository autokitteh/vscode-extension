export type Connection = {
	connectionId: string;
	name: string;
	links: Record<string, string>;
	status: Record<string, any> | undefined;
	capabilities: Record<string, boolean> | undefined;
};
