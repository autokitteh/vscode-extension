// TODO: Get types from ak-proto-ts
import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";

export enum MessageType {
	common = "COMMON",
	deployments = "DEPLOYMENTS",
	projectName = "PROJECT_NAME",
	theme = "THEME",
}

export type Message = {
	type: MessageType;
	payload?: string | object | number | Deployment[];
};
