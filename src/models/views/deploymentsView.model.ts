import { Deployment } from "@type/models";

export type DeploymentSectionViewModel = {
	deployments?: Deployment[];
	totalDeployments: number;
	lastDeployment?: Deployment;
	activeDeploymentId?: string;
	selectedDeploymentId?: string;
};
