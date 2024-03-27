import { MessageType } from "@enums";
import { DeploymentSectionViewModel } from "@models";
import { IIncomingDeploymentsHandler } from "@react-interfaces";
import { Message } from "@type";
import { SessionEntrypoint } from "@type/models";

export const HandleDeploymentsIncomingMessages = (
	event: MessageEvent<Message>,
	handlers: IIncomingDeploymentsHandler
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
			break;
		default:
	}
};
