import { SessionStateType } from "@enums";

export type Deployment = {
	deploymentId: string;
	envId: string;
	buildId: string;
	createdAt?: Date;
	state: number;
	sessionsStats: {
		state: SessionStateType;
		count: number;
	}[];
};
