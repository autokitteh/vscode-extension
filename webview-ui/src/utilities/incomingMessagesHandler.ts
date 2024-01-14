import { MessageType, Theme } from "@enums";
import { DeploymentSectionViewModel, SessionSectionViewModel } from "@models";
import { IIncomingMessagesHandler } from "@react-interfaces";
import { Message } from "@type";
import { projectNameSignal } from "src/signals";

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
			projectNameSignal.value = payload as string;
			break;
		case MessageType.setSessionsSection:
			handlers.setSessionsSection(payload as SessionSectionViewModel);
		default:
	}
};
