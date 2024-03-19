import { useCallback, useEffect, useState } from "react";
import { translate } from "@i18n";
import { SessionSectionViewModel } from "@models/views";
import { AKMonacoEditorModal, AKSessionsTableHeader } from "@react-components";
import { AKSessionsTableBody } from "@react-components/aKSessionTableBody.component";
import { AKTable, AKTableMessage } from "@react-components/AKTable";
import { IIncomingSessionsMessagesHandler } from "@react-interfaces";
import { HandleSessionsIncomingMessages } from "@react-utilities";
import { Message } from "@type";

export const AKSessions = ({ activeDeployment }: { activeDeployment?: string }) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [rerender, setRerender] = useState(0);
	const [modal, setModal] = useState(false);

	const [isLoading, setIsLoading] = useState(true);
	const [deploymentIdForExecution, setDeploymentsIdForExecution] = useState<string | undefined>(activeDeployment);
	const [sessionInputs, setSessionInputs] = useState<string>();
	const [sessionsSection, setSessionsSection] = useState<SessionSectionViewModel | undefined>();
	const [selectedSession, setSelectedSession] = useState<string | undefined>("");

	const handleMessagesFromExtension = useCallback(
		(event: MessageEvent<Message>) => HandleSessionsIncomingMessages(event, messageHandlers),
		[]
	);
	const { sessions, totalSessions } = sessionsSection || {};

	const messageHandlers: IIncomingSessionsMessagesHandler = {
		setSessionsSection,
		setSelectedSession,
	};

	useEffect(() => {
		window.addEventListener("message", handleMessagesFromExtension);
		return () => {
			window.removeEventListener("message", handleMessagesFromExtension);
		};
	}, [handleMessagesFromExtension]);
	useEffect(() => {
		if (isLoading) {
			setIsLoading(false);
		}
	}, [sessions]);
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setModal(false);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		const interval = setInterval(() => {
			setRerender((rerender) => rerender + 1);
		}, 1000);

		return () => {
			clearInterval(interval);
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, []);
	useEffect(() => {
		setDeploymentsIdForExecution(activeDeployment);
	}, [activeDeployment]);

	return (
		<div className="mt-4 h-[43vh] overflow-y-auto overflow-x-hidden">
			<div className="flex items-baseline">
				<h1 className="flex text-lg font-extralight mb-2">{translate().t("reactApp.sessions.tableTitle")}</h1>
				<div className="ml-1 text-lg font-extralight">({totalSessions})</div>
			</div>
			<AKTable>
				<AKSessionsTableHeader />
				<AKSessionsTableBody
					displayInputsModal={setSessionInputs}
					sessions={sessions}
					deploymentIdForExecution={deploymentIdForExecution}
					selectedSession={selectedSession}
					setSelectedSession={setSelectedSession}
				/>
			</AKTable>
			{isLoading && <AKTableMessage>{translate().t("reactApp.general.loading")}</AKTableMessage>}
			{!sessions && !isLoading && (
				<AKTableMessage>{translate().t("reactApp.sessions.pickDeploymentToShowSessions")}</AKTableMessage>
			)}
			{sessions && sessions.length === 0 && (
				<AKTableMessage>{translate().t("reactApp.sessions.noSessionsFound")}</AKTableMessage>
			)}

			{modal && <AKMonacoEditorModal content={sessionInputs} setModal={setModal} />}
		</div>
	);
};

export default AKSessions;
