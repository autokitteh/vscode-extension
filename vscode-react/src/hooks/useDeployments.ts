import { useEffect, useState } from "react";
import { MessageType } from "@enums";
import { useAppDispatch } from "@react-context";
import { useIncomingMessageHandler } from "@react-hooks/useIncomingMessageHandler.hook";
import { SessionEntrypoint } from "@type/models";

export const useDeployments = () => {
	const [selectedDeploymentId, setSelectedDeploymentId] = useState<string>();
	const [entrypoints, setEntrypoints] = useState<Record<string, SessionEntrypoint[]>>();

	useIncomingMessageHandler({
		setEntrypoints,
		setSelectedDeploymentId,
	});

	const { stopLoader } = useAppDispatch();

	useEffect(() => {
		stopLoader(MessageType.setEntrypoints);
	}, [entrypoints]);

	return { selectedDeploymentId, entrypoints };
};
