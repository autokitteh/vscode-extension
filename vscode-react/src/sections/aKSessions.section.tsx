import { useCallback, useEffect, useState } from "react";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import { SessionSectionViewModel } from "@models/views";
import { AKSessionState } from "@react-components";
import {
	AKTable,
	AKTableMessage,
	AKTableCell,
	AKTableHeader,
	AKTableRow,
	AKTableHeaderCell,
} from "@react-components/AKTable";
import { IIncomingSessionsMessagesHandler } from "@react-interfaces";
import { HandleSessionsIncomingMessages, getTimePassed, sendMessage } from "@react-utilities";
import { cn } from "@react-utilities/cnClasses.utils";
import { Message } from "@type";
import { Session } from "@type/models";

export const AKSessions = ({
	setSessionInputsForExecution,
	activeDeployment,
}: {
	setSessionInputsForExecution: (inputs: Record<string, any>) => void;
	activeDeployment: string | undefined;
}) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [rerender, setRerender] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedSession, setSelectedSession] = useState<string | undefined>("");
	const [sessionsSection, setSessionsSection] = useState<SessionSectionViewModel | undefined>();
	const { sessions, totalSessions } = sessionsSection || {};
	const messageHandlers: IIncomingSessionsMessagesHandler = {
		setSessionsSection,
		setSelectedSession,
	};
	const [highlightedSession, setHighlightedSession] = useState<string | null>(null);

	const handleMessagesFromExtension = useCallback(
		(event: MessageEvent<Message>) => HandleSessionsIncomingMessages(event, messageHandlers),
		[]
	);
	const displaySessionLogs = (sessionId: string) => {
		sendMessage(MessageType.displaySessionLogs, sessionId);
		setSelectedSession(sessionId);
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
		const interval = setInterval(() => {
			setRerender((rerender) => rerender + 1);
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	const setSessionInputsAndHighlight = (session: Session) => {
		setSessionInputsForExecution(session.inputs);
		setHighlightedSession(session.sessionId);
		setTimeout(() => {
			setHighlightedSession(null);
		}, 1500); // Remove the highlight after 3 seconds
	};

	const executeSession = (session: Session) => {
		console.log("activeDeployment", activeDeployment);

		if (!activeDeployment) {
			// Display Error
			return;
		}
		const sessionExecutionData = {
			deploymentId: activeDeployment,
			sessionInputs: session.inputs,
			entrypoint: session.entrypoint,
		};

		sendMessage(MessageType.runSessionExecution, sessionExecutionData);
	};

	return (
		<div className="mt-4  h-[43vh] overflow-y-auto overflow-x-hidden">
			<div className="flex items-baseline">
				<h1 className="flex text-lg font-extralight mb-2">{translate().t("reactApp.sessions.tableTitle")}</h1>
				<div className="ml-1 text-lg font-extralight">({totalSessions})</div>
			</div>
			<AKTable>
				<AKTableHeader classes="sticky top-0">
					<AKTableHeaderCell>{translate().t("reactApp.sessions.time")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.sessions.status")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.sessions.sessionId")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.sessions.actions")}</AKTableHeaderCell>
				</AKTableHeader>
				{sessions &&
					sessions.map((session: Session) => (
						<AKTableRow key={session.sessionId} isSelected={selectedSession === session.sessionId}>
							<AKTableCell onClick={() => displaySessionLogs(session.sessionId)} classes={["cursor-pointer"]}>
								{getTimePassed(session.createdAt)}
							</AKTableCell>
							<AKTableCell onClick={() => displaySessionLogs(session.sessionId)} classes={["cursor-pointer"]}>
								<AKSessionState sessionState={session.state} />
							</AKTableCell>
							<AKTableCell onClick={() => displaySessionLogs(session.sessionId)} classes={["cursor-pointer"]}>
								{session.sessionId}
							</AKTableCell>
							<AKTableCell>
								<div
									className="codicon codicon-redo mr-2 cursor-pointer"
									title="Execute"
									onClick={() => executeSession(session)}
								></div>
								<div
									onClick={() => setSessionInputsAndHighlight(session)}
									className={cn([
										"cursor-pointer",
										"codicon codicon-clippy",
										{
											// eslint-disable-next-line @typescript-eslint/naming-convention
											"text-green-500": highlightedSession === session.sessionId,
										},
									])}
								></div>
							</AKTableCell>
						</AKTableRow>
					))}
			</AKTable>
			{isLoading && <AKTableMessage>{translate().t("reactApp.general.loading")}</AKTableMessage>}
			{!sessions && !isLoading && (
				<AKTableMessage>{translate().t("reactApp.sessions.pickDeploymentToShowSessions")}</AKTableMessage>
			)}
			{sessions && sessions.length === 0 && (
				<AKTableMessage>{translate().t("reactApp.sessions.noSessionsFound")}</AKTableMessage>
			)}
		</div>
	);
};

export default AKSessions;
