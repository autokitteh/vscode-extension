import { useState } from "react";
import { useIncomingMessageHandler } from "@react-hooks/useIncomingMessageHandler.hook";
import { SessionEntrypoint } from "@type/models";

export const useDeployments = () => {
	const [selectedDeploymentId, setSelectedDeploymentId] = useState<string>();
	const [entrypoints, setEntrypoints] = useState<Record<string, SessionEntrypoint[]>>();

	useIncomingMessageHandler({
		setEntrypoints,
		setSelectedDeploymentId,
	});

	return { selectedDeploymentId, entrypoints };
};
