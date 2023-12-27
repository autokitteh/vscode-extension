import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { Project } from "@ak-proto-ts/projects/v1/project_pb";
import { Session } from "@ak-proto-ts/sessions/v1/session_pb";
import { MessageType } from "@enums";

export type Message = {
	type: MessageType;
	payload: string | object | number | Deployment[] | Session[] | Project;
};
