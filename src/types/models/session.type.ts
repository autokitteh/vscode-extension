import { Dict_Item } from "@ak-proto-ts/values/v1/values_pb";

export type Session = {
	sessionId: string;
	deploymentId: string;
	state: number;
	createdAt: Date;
	eventData: Dict_Item[];
};

export type Callstack = {
	location: {
		col: number;
		row: number;
		name: string;
		path: string;
	};
};
