import React, { useContext } from "react";
import { MessageType } from "@enums";
import { AKSessionState } from "@react-components";
import { AKTableRow, AKTableCell } from "@react-components/AKTable";
import { SessionStartContext } from "@react-context";
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
	const { lastDeployment } = useContext(SessionStartContext);

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
								<div>
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
						</AKTableCell>
					</AKTableRow>
				))}
		</>
	);
};
