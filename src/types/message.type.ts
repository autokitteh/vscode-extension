import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { Project } from "@ak-proto-ts/projects/v1/project_pb";

export enum MessageType {
	common = "COMMON",
	deployments = "DEPLOYMENTS",
	project = "PROJECT",
	theme = "THEME",
	deployProject = "DEPLOY_PROJECT",
	buildProject = "BUILD_PROJECT",
}

export type Message = {
	type: MessageType;
	payload: string | object | number | Deployment[] | Project;
};
