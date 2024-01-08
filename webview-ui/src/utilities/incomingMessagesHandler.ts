import { MessageType, Theme } from "@enums";
import { DeploymentSectionViewModel, SessionSectionViewModel } from "@models";
import { SessionLogViewModel } from "@models/views";
import { IIncomingMessagesHandler } from "@react-interfaces";
import { Message } from "@type";

export const HandleIncomingMessages = (
	event: MessageEvent<Message>,
	handlers: IIncomingMessagesHandler
) => {
	const { payload } = event.data as Message;

	switch (event.data.type) {
		case MessageType.setTheme:
			handlers.setThemeVisualType(payload as Theme);
			break;
		case MessageType.setDeployments:
			handlers.setDeploymentsSection(payload as DeploymentSectionViewModel);
			break;
		case MessageType.setProjectName:
			handlers.setProjectName(payload as string);
			break;
		case MessageType.setSessionsSection:
			handlers.setSessionsSection(payload as SessionSectionViewModel);
		case MessageType.setSessionLogs:
			handlers.setSessionLogsPage(payload as SessionLogViewModel);
		default:
	}
};
