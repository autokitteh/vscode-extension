import { useState, useEffect, useCallback } from "react";
import { DeploymentSectionViewModel } from "@models/views";
import { IIncomingDeploymentsMessagesHandler } from "@react-interfaces";
import { HandleDeploymentsIncomingMessages } from "@react-utilities";
import { Message } from "@type";
import { SessionExecutionForView } from "@type/views";

// This is a simplification. You might need to adjust it based on your real API calls or context setup.
export const useDeployments = () => {
	const [deploymentsSection, setDeploymentsSection] = useState<DeploymentSectionViewModel>();
	const [selectedDeploymentId, setSelectedDeploymentId] = useState<string>();
	const [entrypoints, setEntrypoints] = useState<SessionExecutionForView>();

	const messageHandlers: IIncomingDeploymentsMessagesHandler = {
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
