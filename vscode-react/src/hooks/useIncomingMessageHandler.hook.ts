import { useEffect } from "react";
import { MessageType, Theme } from "@enums";
import { DeploymentSectionViewModel, SessionSectionViewModel } from "@models";
import { IIncomingMessagesHandler } from "@react-interfaces";
import { Message } from "@type";
import { SessionEntrypoint } from "@type/models";

export const useIncomingMessageHandler = (handlers: IIncomingMessagesHandler) => {
	useEffect(() => {
		const handleMessagesFromExtension = (event: MessageEvent<Message>) => {
			const { type, payload } = event.data;

			switch (type) {
				case MessageType.setTheme:
					handlers.setThemeVisualType?.(payload as Theme);
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
					handlers.setEntrypoints?.(payload as Record<string, SessionEntrypoint[]>);
					break;
				case MessageType.setSessionsSection:
					handlers.setSessionsSection?.(payload as SessionSectionViewModel);
					break;
				case MessageType.selectSession:
					handlers.setSelectedSession?.(payload as string);
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
			}
		};

		window.addEventListener("message", handleMessagesFromExtension);
		return () => {
			window.removeEventListener("message", handleMessagesFromExtension);
		};
	}, [handlers]);
};
