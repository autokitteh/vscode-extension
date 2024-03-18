import { useCallback, useEffect, useState } from "react";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import { SessionSectionViewModel } from "@models/views";
import { Editor } from "@monaco-editor/react";
import { AKButton, AKModal, AKSessionState } from "@react-components";
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
import { Message } from "@type";
import { Session } from "@type/models";

export const AKSessions = ({ activeDeployment }: { activeDeployment: string | undefined }) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [rerender, setRerender] = useState(0);
	const [modal, setModal] = useState(false);

	const [isLoading, setIsLoading] = useState(true);
	const [selectedSession, setSelectedSession] = useState<string | undefined>("");
	const [sessionsSection, setSessionsSection] = useState<SessionSectionViewModel | undefined>();
	const { sessions, totalSessions } = sessionsSection || {};
	const messageHandlers: IIncomingSessionsMessagesHandler = {
		setSessionsSection,
		setSelectedSession,
	};
	const [deploymentIdForExecution, setDeploymentsIdForExecution] = useState<string | undefined>(activeDeployment);
	const [sessionInputs, setSessionInputs] = useState<string>();

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

	const executeSession = (session: Session) => {
		if (!deploymentIdForExecution) {
			// Display Error
			return;
		}
		const sessionExecutionData = {
			sessionId: session.sessionId,
			deploymentId: deploymentIdForExecution,
			entrypoint: session.entrypoint,
		};

		sendMessage(MessageType.runSessionExecution, sessionExecutionData);
	};

	const displayInputsModal = (sessionInputs: string) => {
		setSessionInputs(JSON.parse(sessionInputs));
		setModal(true);
	};

	return (
		<div className="mt-4 h-[43vh] overflow-y-auto overflow-x-hidden">
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
								{session.deploymentId === deploymentIdForExecution && (
									<div>
										<div
											className="codicon codicon-redo mr-2 cursor-pointer"
											title="Execute"
											onClick={() => executeSession(session)}
										></div>
										<div
											className="codicon codicon-symbol-namespace mr-2 cursor-pointer"
											title="Execute"
											onClick={() => displayInputsModal(JSON.stringify(session.inputs))}
										></div>
									</div>
								)}
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

			{modal && (
				<AKModal>
					<div className="flex justify-end cursor-pointer" onClick={() => setModal(false)}>
						X
					</div>
					<div className="m-auto">
						<div className="flex w-full justify-end mt-2">
							<Editor
								height="90vh"
								defaultLanguage="json"
								defaultValue={sessionInputs ? JSON.stringify(sessionInputs, null, 2) : ""}
								theme="vs-dark"
								options={{ readOnly: true }}
							/>
						</div>
						<div className="flex w-full justify-end mt-2">
							<AKButton classes="ml-2" onClick={() => setModal(false)}>
								{translate().t("reactApp.deployments.closeModalButton")}
							</AKButton>
						</div>
					</div>
				</AKModal>
			)}
		</div>
	);
};

export default AKSessions;
