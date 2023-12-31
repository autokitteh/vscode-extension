import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { Project } from "@ak-proto-ts/projects/v1/project_pb";
import { Session } from "@type/models";

export enum MessageType {
	setDeployments = "SET_DEPLOYMENTS",
	setProjectName = "SET_PROJECT_NAME",
	setTheme = "SET_THEME",
	runProject = "RUN_PROJECT",
	buildProject = "BUILD_PROJECT",
	setSessions = "SET_SESSIONS",
	selectDeployment = "SELECT_DEPLOYMENT",
}

export type Message = {
	type: MessageType;
	payload: string | object | number | Deployment[] | Session[] | Project;
};
