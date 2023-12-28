import { DeploymentType } from "@type/models/deployment.type";

export type ProjectType = {
	projectId: string;
	projectName: string;
	deployments: DeploymentType[];
};
