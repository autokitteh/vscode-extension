export type Session = {
	sessionId: string;
	deploymentId: string;
	state: number;
	createdAt: Date;
	inputs: object;
};

export type Callstack = {
	location: {
		col: number;
		row: number;
		name: string;
		path: string;
	};
};
