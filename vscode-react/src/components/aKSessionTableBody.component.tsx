import React, { useCallback, useEffect, useRef, useState } from "react";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import { AKMonacoEditorModal, AKOverlay, AKSessionState, DeletePopper, PopperComponent } from "@react-components";
import { AKTableRow, AKTableCell } from "@react-components/AKTable";
import { useAppState } from "@react-context";
import { SessionState } from "@react-enums";
import { useCloseOnEscape, useIncomingMessageHandler } from "@react-hooks";
import { getTimePassed, sendMessage } from "@react-utilities";
import { Session } from "@type/models";
import { createPortal } from "react-dom";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";

export const AKSessionsTableBody = ({
	sessions,
	selectedSession,
	setSelectedSession,
	heightProp,
}: {
	sessions?: Session[];
	selectedSession?: string;
	setSelectedSession: (sessionId: string) => void;
	heightProp: string | number;
}) => {
	// State Section
	const [{ modalName, lastDeployment }, dispatch] = useAppState();
	const [isDeletingInProcess, setIsDeletingInProgress] = useState(false);
	const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
	const deletePopperElementRef = useRef<HTMLDivElement | null>(null);
	const [inputsModalVisible, setInputsModalVisible] = useState(false);
	const [sessionInputs, setSessionInputs] = useState<string>();

	// Hooks Section
	useCloseOnEscape(() => setInputsModalVisible(false));

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

	const displayInputsModal = (sessionInputs: string) => {
		setSessionInputs(sessionInputs);
		setInputsModalVisible(true);
	};

	const getStopSessionClass = (sessionState: SessionState) => {
		const isRunningClass =
			sessionState === SessionState.RUNNING ? "text-red-500 cursor-pointer" : "text-gray-500 cursor-not-allowed";
		return `codicon codicon-debug-stop mr-2 ${isRunningClass}`;
	};

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

	const stopSession = (session: Session) => {
		if (session.state !== SessionState.RUNNING) {
			return;
		}
		sendMessage(MessageType.stopSession, session.sessionId);
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
			sendMessage(
				MessageType.displayErrorWithoutActionButton,
				translate().t("reactApp.sessions.deleteSessionDisabled")
			);
			return;
		}
		const refElement = event.currentTarget;
		showPopper();
		deletePopperElementRef.current = refElement;
		setDeleteSessionId(session.sessionId);
	};

	const isRunning = (sessionState: SessionState) => sessionState === SessionState.RUNNING;

	const isLastDeployment = (deploymentId: string) => deploymentId === lastDeployment?.deploymentId;

	// useEffects Section
	useEffect(() => {
		hidePopper();
	}, []);

	const Row = ({ index, style, data }) => (
		<div style={style}>
			{data[index] ? `Session ID: ${data[index].sessionId}, State: ${data[index].state}` : "Loading..."}
		</div>
	);

	const handleItemsRendered = ({ visibleStopIndex }) => {
		if (visibleStopIndex >= 30 - 2) {
			// Load more items when close to the end
			console.log("Load more items");
		}
	};

	const handleScroll = useCallback(({ scrollDirection, scrollOffset, scrollUpdateWasRequested }) => {
		if (scrollOffset === 0) {
			console.log("Scrolled to the top!");
		}
	}, []);

	console.log("heightProp", heightProp);

	return (
		<>
			<AutoSizer>
				{({ height, width }) => (
					<List
						height={heightProp - 70}
						itemCount={30}
						itemSize={50} // Adjust based on your row height
						width={width}
						itemData={sessions || []}
						onItemsRendered={handleItemsRendered}
						onScroll={handleScroll}
					>
						{Row}
					</List>
				)}
			</AutoSizer>
		</>
	);
};
