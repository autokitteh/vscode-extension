import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import { AKMonacoEditorModal, AKOverlay, AKSessionState, DeletePopper, PopperComponent } from "@react-components";
import { AKTableRow, AKTableCell, AKTable, AKTableHeader, AKTableHeaderCell } from "@react-components/AKTable";
import { useAppState } from "@react-context";
import { SessionState } from "@react-enums";
import { useCloseOnEscape, useIncomingMessageHandler } from "@react-hooks";
import { getTimePassed, sendMessage } from "@react-utilities";
import { Session } from "@type/models";
import memoizeOne from "memoize-one";
import { createPortal } from "react-dom";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List, areEqual } from "react-window";

const Row = memo(({ data, index, style }) => {
	const { sessions, selectedSessionId } = data;
	const node = sessions[index];
	const isSelectedRow = selectedSessionId === node?.sessionId;
	return (
		node && (
			<div style={style} className="w-full">
				<AKTableRow className="flex justify-around" isSelected={isSelectedRow}>
					<AKTableCell classes={["cursor-pointer"]}>{getTimePassed(node.createdAt)}</AKTableCell>
					<AKTableCell classes={["cursor-pointer"]}>
						<AKSessionState sessionState={node.state} />
					</AKTableCell>
					<AKTableCell classes={["cursor-pointer w-1/5"]}>{node.sessionId}</AKTableCell>
					<AKTableCell>231</AKTableCell>
				</AKTableRow>
			</div>
		)
	);
}, areEqual);

const getItemData = memoizeOne((selectedSessionId, sessions) => ({
	selectedSessionId,
	sessions,
}));

export const AKSessionsTableBody = ({
	sessions,
	selectedSession,
	setSelectedSession,
	heightProp,
	widthProp,
}: {
	sessions?: Session[];
	selectedSession?: string;
	setSelectedSession: (sessionId: string) => void;
	heightProp: string | number;
	widthProp: string | number;
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

	const handleItemsRendered = ({ visibleStopIndex }) => {
		console.log("visibleStopIndex", visibleStopIndex);

		if (visibleStopIndex >= sessions?.length || 0 - 2) {
			// Load more items when close to the end
			console.log("Load more items");
		}
	};

	const handleScroll = useCallback(({ scrollDirection, scrollOffset, scrollUpdateWasRequested }) => {
		console.log("scrollOffset", scrollOffset);

		if (scrollOffset === 0) {
			console.log("Scrolled to the top!");
		}
	}, []);

	console.log("heightProp", heightProp);

	const itemData = getItemData(selectedSession, sessions || []);

	return (
		<AKTable>
			<AKTableHeader classes="flex justify-around">
				<AKTableHeaderCell>{translate().t("reactApp.sessions.time")}</AKTableHeaderCell>
				<AKTableHeaderCell>{translate().t("reactApp.sessions.status")}</AKTableHeaderCell>
				<AKTableHeaderCell className="w-1/5">{translate().t("reactApp.sessions.sessionId")}</AKTableHeaderCell>
				<AKTableHeaderCell>{translate().t("reactApp.sessions.actions")}</AKTableHeaderCell>
			</AKTableHeader>
			<List
				height={heightProp}
				width={widthProp}
				itemCount={sessions?.length || 0}
				itemSize={30} // Adjust based on your row height
				itemData={itemData}
				onItemsRendered={handleItemsRendered}
				onScroll={(e) => console.log(e)}
				itemKey={(index) => sessions?.[index]?.sessionId || 0}
			>
				{Row}
			</List>
		</AKTable>
	);
};
