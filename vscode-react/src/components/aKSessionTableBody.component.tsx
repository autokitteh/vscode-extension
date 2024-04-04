import React, { useEffect, useRef, useState } from "react";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import { AKSessionState, DeletePopper, PopperComponent } from "@react-components";
import { AKTableRow, AKTableCell } from "@react-components/AKTable";
import { useAppState } from "@react-context";
import { SessionState } from "@react-enums";
import { useIncomingMessageHandler } from "@react-hooks";
import { getTimePassed, sendMessage } from "@react-utilities";
import { Session } from "@type/models";

export const AKSessionsTableBody = ({
	sessions,
	displayInputsModal,
	selectedSession,
	setSelectedSession,
}: {
	sessions?: Session[];
	displayInputsModal: (sessionInputs: string) => void;
	selectedSession?: string;
	setSelectedSession: (sessionId: string) => void;
}) => {
	// State Hooks Section
	const [{ modalName, lastDeployment }, dispatch] = useAppState();
	const [isDeletingInProcess, setIsDeletingInProgress] = useState(false);
	const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
	const deletePopperElementRef = useRef<HTMLDivElement | null>(null);

	// Local variable
	const deleteSessionPopperTranslations = {
		title: translate().t("reactApp.sessions.deletionApprovalQuestion"),
		subtitle: translate().t("reactApp.sessions.deletionApprovalQuestionSubtitle"),
	};

	// Incoming Messages Handler
	const handleSessionDeletedResponse = () => {
		setIsDeletingInProgress(false);
		hidePopper();
	};

	useIncomingMessageHandler({ handleSessionDeletedResponse });

	// Functions Section
	const showPopper = () => dispatch({ type: "SET_MODAL_NAME", payload: "sessionDelete" });
	const hidePopper = () => dispatch({ type: "SET_MODAL_NAME", payload: "" });
	const startSession = (session: Session) => {
		const startSessionArgs = {
			sessionId: session.sessionId,
			buildId: lastDeployment?.buildId,
			deploymentId: lastDeployment?.deploymentId,
			entrypoint: session.entrypoint,
		};

		sendMessage(MessageType.startSession, startSessionArgs);
	};

	const displaySessionLogs = (sessionId: string) => {
		sendMessage(MessageType.displaySessionLogs, sessionId);
		setSelectedSession(sessionId);
	};

	const deleteSessionConfirmed = () => {
		sendMessage(MessageType.deleteSession, deleteSessionId);
		setIsDeletingInProgress(true);
		return;
	};

	const deleteSessionDismissed = () => {
		setIsDeletingInProgress(false);
		setDeleteSessionId("");
		hidePopper();
	};

	const displaySessionDeletePopper = (event: React.MouseEvent<HTMLDivElement>, session: Session) => {
		if (session.state === SessionState.RUNNING) {
			return;
		}
		const refElement = event.currentTarget;
		showPopper();
		deletePopperElementRef.current = refElement;
		setDeleteSessionId(session.sessionId);
	};

	const isRunning = (sessionState: SessionState) => sessionState === SessionState.RUNNING;

	// useEffects Section
	useEffect(() => {
		hidePopper();
	}, []);

	return (
		<>
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
							{session.deploymentId === lastDeployment?.deploymentId && (
								<div className="inline-block">
									<div
										className="codicon codicon-redo mr-2 cursor-pointer"
										title="Execute"
										onClick={() => startSession(session)}
									></div>
									<div
										className="codicon codicon-symbol-namespace mr-2 cursor-pointer"
										title="Execute"
										onClick={() => displayInputsModal(JSON.stringify(session.inputs, null, 2))}
									></div>
								</div>
							)}
							<div
								className={`inline-block codicon codicon-trash z-20 ${
									isRunning(session.state) ? "cursor-not-allowed" : "cursor-pointer"
								}`}
								title={
									isRunning(session.state)
										? translate().t("reactApp.sessions.deleteSessionDisabled")
										: translate().t("reactApp.sessions.delete")
								}
								onClick={(event) => displaySessionDeletePopper(event, session)}
							></div>
							<PopperComponent visible={modalName === "sessionDelete"} referenceRef={deletePopperElementRef}>
								<DeletePopper
									isDeletingInProcess={isDeletingInProcess}
									onConfirm={() => deleteSessionConfirmed()}
									onDismiss={() => deleteSessionDismissed()}
									translations={deleteSessionPopperTranslations}
								/>
							</PopperComponent>
						</AKTableCell>
					</AKTableRow>
				))}
		</>
	);
};
