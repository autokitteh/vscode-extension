import { Project } from "@ak-proto-ts/projects/v1/project_pb";
import { Session } from "@ak-proto-ts/sessions/v1/session_pb";
import { MessageType } from "@enums";
import { Deployment } from "@type/models/deployment.type";

export type Message = {
	type: MessageType;
	payload: string | object | number | Deployment[] | Session[] | Project;
};
