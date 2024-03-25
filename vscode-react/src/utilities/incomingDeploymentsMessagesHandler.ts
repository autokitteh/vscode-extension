import { MessageType } from "@enums";
import { DeploymentSectionViewModel } from "@models";
import { IIncomingDeploymentsMessagesHandler } from "@react-interfaces";
import { IIncomingMessagesDeploymentsHandler } from "@react-interfaces/incomingDeploymentsMessagesHandler.interface";
import { Message } from "@type";
import { SessionEntrypoint } from "@type/models";

export const HandleDeploymentsIncomingMessages = (
	event: MessageEvent<Message>,
	handlers: IIncomingMessagesDeploymentsHandler
) => {
	const { payload } = event.data as Message;
	switch (event.data.type) {
		case MessageType.setDeployments:
			handlers.setDeploymentsSection(payload as DeploymentSectionViewModel);
			break;
		case MessageType.selectDeployment:
			handlers.setSelectedDeploymentId(payload as string);
			break;
		case MessageType.selectDeployment:
			handlers.setSelectedDeploymentId(payload as string);
			break;
		case MessageType.setEntrypoints:
			handlers.setEntrypoints(payload as Record<string, SessionEntrypoint[]>);
		default:
	}
};
export const HandleIncomingDeploymentsMessages = (
	event: MessageEvent<Message>,
	handlers: IIncomingDeploymentsMessagesHandler
) => {
	const { payload } = event.data as Message;
	switch (event.data.type) {
		case MessageType.deploymentDeletedResponse:
			handlers.handleDeploymentDeletedResponse(payload as boolean);
			break;
		default:
	}
};
