import { useState, useEffect, useCallback } from "react";
import { DeploymentSectionViewModel } from "@models/views";
import { IIncomingMessagesDeploymentsHandler } from "@react-interfaces/incomingDeploymentsMessagesHandler.interface";
import { HandleDeploymentsIncomingMessages } from "@react-utilities";
import { Message } from "@type";
import { SessionEntrypoint } from "@type/models";

export const useDeployments = () => {
	const [deploymentsSection, setDeploymentsSection] = useState<DeploymentSectionViewModel>();
	const [selectedDeploymentId, setSelectedDeploymentId] = useState<string>();
	const [entrypoints, setEntrypoints] = useState<Record<string, SessionEntrypoint[]>>();

	const messageHandlers: IIncomingMessagesDeploymentsHandler = {
		setEntrypoints,
		setDeploymentsSection,
		setSelectedDeploymentId,
	};
	const handleMessagesFromExtension = useCallback(
		(event: MessageEvent<Message>) => HandleDeploymentsIncomingMessages(event, messageHandlers),
		[]
	);

	useEffect(() => {
		window.addEventListener("message", handleMessagesFromExtension);
		return () => {
			window.removeEventListener("message", handleMessagesFromExtension);
		};
	}, [handleMessagesFromExtension]);

	return { deploymentsSection, selectedDeploymentId, entrypoints };
};
