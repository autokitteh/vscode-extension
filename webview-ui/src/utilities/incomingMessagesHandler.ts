import { IIncomingMessagesHandler } from "@interfaces";
import { Deployment } from "@parent-ak-proto-ts/deployments/v1/deployment_pb";
import { Project } from "@parent-ak-proto-ts/projects/v1/project_pb";
import { Theme } from "@parent-enums/index";
import { Message, MessageType } from "@parent-type/index";

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
