import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { Project } from "@ak-proto-ts/projects/v1/project_pb";
import { Theme } from "@enums/index";
import { Message, MessageType } from "@type/index";
import { IIncomingMessagesHandler } from "../interfaces/incomingMessagesHandler.interface";

export const HandleIncomingMessages = (
	event: MessageEvent<Message>,
	delegate: IIncomingMessagesHandler
) => {
	const { payload } = event.data as Message;

	switch (event.data.type) {
		case MessageType.common:
			delegate.setDirectory(payload as string);
			break;
		case MessageType.theme:
			delegate.setThemeVisualType(payload as Theme);
			break;
		case MessageType.deployments:
			delegate.setDeployments(payload as Deployment[]);
			break;
		case MessageType.project:
			delegate.setProject(payload as Project);
			break;
		default:
	}
};
