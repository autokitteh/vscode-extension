import { Deployment } from "@type";

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
