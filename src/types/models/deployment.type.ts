import { SessionStateType } from "@enums";

export type Deployment = {
	deploymentId: string;
	envId: string;
	buildId: string;
	createdAt: Date;
	state: number;
	sessionStats?: DeploymentSessionsStats[];
};

export type DeploymentSessionsStats = {
	state: SessionStateType;
	count: number;
};
