import { MessageType, Theme } from "@enums";
import { DeploymentSectionViewModel, SessionSectionViewModel } from "@models";
import { IIncomingMessagesHandler } from "@react-interfaces";
import { Message } from "@type";
<<<<<<< HEAD
import { Connection } from "@type/models";
=======
import { Connection, SessionEntrypoint } from "@type/models";
import { useEffect } from "react";
>>>>>>> e2d1b815 (feat: add liferay and perfectionist plugin to eslint of react app)

export const useIncomingMessageHandler = (handlers: IIncomingMessagesHandler) => {
	useEffect(() => {
		const handleMessagesFromExtension = (event: MessageEvent<Message>) => {
			const { payload, type } = event.data;

			switch (type) {
				case MessageType.setTheme:
					handlers.setTheme?.(payload as Theme);
					break;
				case MessageType.setProjectName:
					handlers.setProjectName?.(payload as string);
					break;
				case MessageType.setResourcesDir:
					handlers.setResourcesDir?.(payload as string);
					break;
				case MessageType.setDeployments:
					handlers.setDeploymentsSection?.(payload as DeploymentSectionViewModel);
					break;
				case MessageType.selectDeployment:
					handlers.setSelectedDeploymentId?.(payload as string);
					break;
				case MessageType.setEntrypoints:
					handlers.setEntrypoints?.(payload as string[]);
					break;
				case MessageType.setSessionsSection:
					handlers.setSessionsSection?.(payload as SessionSectionViewModel);
					break;
				case MessageType.selectSession:
					handlers.setSelectedSession?.(payload as string);
					break;
				case MessageType.setConnections:
					handlers.setConnections?.(payload as Connection[]);
					break;
				case MessageType.startLoader:
					handlers.startLoader?.();
					break;
				case MessageType.stopLoader:
					handlers.stopLoader?.();
					break;
				case MessageType.setRetryCountdown:
					handlers.setRetryCountdown?.(payload as string);
					break;
				default:
			}
		};

		window.addEventListener("message", handleMessagesFromExtension);

		return () => {
			window.removeEventListener("message", handleMessagesFromExtension);
		};
	}, [handlers]);
};
