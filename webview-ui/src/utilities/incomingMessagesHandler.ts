import { IIncomingMessagesHandler } from "@interfaces";
import { Message, MessageType } from "@parent-type/index";

export const HandleIncomingMessages = (
	event: MessageEvent<Message>,
	handlers: IIncomingMessagesHandler
) => {
	const { payload } = event.data as Message;

	switch (event.data.type) {
		case MessageType.common:
			handlers.setDirectory(payload);
			break;
		case MessageType.theme:
			handlers.setThemeVisualType(payload);
			break;
		case MessageType.deployments:
			handlers.setDeployments(payload);
			break;
		case MessageType.project:
			handlers.setProjectName(payload);
			break;
		default:
	}
};
