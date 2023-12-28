export type Deployment = {
	deploymentId: string;
	envId: string;
	buildId: string;
	createdAt?: Date;
	state: number;
};

/**
 * State of the deployment.
 */
/**
DEPLOYMENT_STATE_UNSPECIFIED = 0
DEPLOYMENT_STATE_ACTIVE = 1
DEPLOYMENT_STATE_TESTING = 2
DEPLOYMENT_STATE_DRAINING = 3
DEPLOYMENT_STATE_INACTIVE = 4
 */
