import React, { useEffect, useRef, useState } from "react";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import { SessionState, DeletePopper, PopperComponent } from "@react-components";
import { TableRow, TableCell } from "@react-components/atoms/table";
import { useAppState } from "@react-context";
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

	// useEffects Section
	useEffect(() => {
		hidePopper();
	}, []);

	return (
		<>
			{sessions &&
				sessions.map((session: Session) => (
					<TableRow key={session.sessionId} isSelected={selectedSession === session.sessionId}>
						<TableCell onClick={() => displaySessionLogs(session.sessionId)} classes={["cursor-pointer"]}>
							{getTimePassed(session.createdAt)}
						</TableCell>
						<TableCell onClick={() => displaySessionLogs(session.sessionId)} classes={["cursor-pointer"]}>
							<SessionState sessionState={session.state} />
						</TableCell>
						<TableCell onClick={() => displaySessionLogs(session.sessionId)} classes={["cursor-pointer"]}>
							{session.sessionId}
						</TableCell>
						<TableCell>
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
								className="inline-block codicon codicon-trash cursor-pointer z-20"
								onClick={(e) => {
									const refElement = e.currentTarget;
									showPopper();
									deletePopperElementRef.current = refElement;
									setDeleteSessionId(session.sessionId);
								}}
							></div>
							<PopperComponent visible={modalName === "sessionDelete"} referenceRef={deletePopperElementRef}>
								<DeletePopper
									isDeletingInProcess={isDeletingInProcess}
									onConfirm={() => deleteSessionConfirmed()}
									onDismiss={() => deleteSessionDismissed()}
									translations={deleteSessionPopperTranslations}
								/>
							</PopperComponent>
						</TableCell>
					</TableRow>
				))}
		</>
	);
};
