import React from "react";
import { MessageType } from "@enums";
import { AKSessionState } from "@react-components";
import { AKTableRow, AKTableCell } from "@react-components/AKTable";
import { getTimePassed, sendMessage } from "@react-utilities";
import { Session } from "@type/models";

export const AKSessionsTableBody = ({
	sessions,
	displayInputsModal,
	deploymentIdForExecution,
	selectedSession,
	setSelectedSession,
}: {
	sessions?: Session[];
	displayInputsModal: (sessionInputs: string) => void;
	deploymentIdForExecution?: string;
	selectedSession?: string;
	setSelectedSession: (sessionId: string) => void;
}) => {
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

	const displaySessionLogs = (sessionId: string) => {
		sendMessage(MessageType.displaySessionLogs, sessionId);
		setSelectedSession(sessionId);
	};
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
		</>
	);
};
