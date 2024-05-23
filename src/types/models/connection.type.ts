export type Connection = {
	connectionId: string;
	name: string;
	initURL?: string;
	testURL?: string;
	integrationId?: string;
	integrationName?: string;
	status: string;
	statusInfoMessage: string;
};
