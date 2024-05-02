import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import { AKMonacoEditorModal, AKSessionsTableRow } from "@react-components";
import { AKTable, AKTableHeader, AKTableHeaderCell } from "@react-components/AKTable";
import { useAppState } from "@react-context";
import { SessionState } from "@react-enums";
import { useCloseOnEscape, useIncomingMessageHandler } from "@react-hooks";
import { AKSessionsTableRowProps } from "@react-types";
import { getSessionActions, sendMessage } from "@react-utilities";
import { Session } from "@type/models";
import { createPortal } from "react-dom";
import { FixedSizeList as List, ListOnItemsRenderedProps, ListOnScrollProps } from "react-window";

export const AKSessionsTableBody = ({
	sessions,
	selectedSession,
	setSelectedSession,
	heightProp,
	widthProp,
	disableLiveTail,
	liveTailState,
}: {
	sessions?: Session[];
	selectedSession?: string;
	setSelectedSession: (sessionId: string) => void;
	heightProp: string | number;
	widthProp: string | number;
	disableLiveTail: () => void;
	liveTailState: boolean;
}) => {
	// State Section
	const [{ modalName, lastDeployment }, dispatch] = useAppState();
	const [isDeletingInProcess, setIsDeletingInProgress] = useState(false);
	const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
	const deletePopperElementRef = useRef<HTMLDivElement | null>(null);
	const [inputsModalVisible, setInputsModalVisible] = useState(false);
	const [sessionInputs, setSessionInputs] = useState<string>();
	const listRef = useRef<List>(null);

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

	const showPopper = () => dispatch({ type: "SET_MODAL_NAME", payload: "sessionDelete" });
	const hidePopper = () => dispatch({ type: "SET_MODAL_NAME", payload: "" });

	const displaySessionLogs = (sessionId: string) => {
		sendMessage(MessageType.displaySessionLogsAndStop, sessionId);
		disableLiveTail();
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

	// useEffects Section
	useEffect(() => {
		hidePopper();
	}, []);

	useEffect(() => {
		if (listRef.current && liveTailState) {
			listRef.current.scrollTo(0); // Scroll to the top
		}
	}, [liveTailState]);

	const handleItemsRendered = ({ visibleStopIndex }: ListOnItemsRenderedProps) => {
		if (visibleStopIndex >= (sessions?.length || 0) - 1) {
			sendMessage(MessageType.loadMoreSessions);
			return;
		}
	};

	const handleScroll = useCallback(({ scrollOffset }: ListOnScrollProps) => {
		if (scrollOffset !== 0) {
			disableLiveTail();
		}
	}, []);

	const sessionActions = {
		displayInputsModal,
		displaySessionDeletePopper,
		...getSessionActions(lastDeployment!),
	};

	const itemData = useMemo(
		() => ({
			sessions,
			sessionActions,
			selectedSessionId: selectedSession,
			displaySessionLogs,
			modalName,
			hidePopper,
			isDeletingInProcess,
			deleteSessionConfirmed,
			deleteSessionDismissed,
			deleteSessionPopperTranslations,
			deletePopperElementRef,
		}),
		[sessions, selectedSession, lastDeployment, modalName, isDeletingInProcess]
	);

	return (
		<>
			{inputsModalVisible &&
				createPortal(
					<AKMonacoEditorModal content={sessionInputs} onCloseClicked={() => setInputsModalVisible(false)} />,
					document.body
				)}
			<AKTable>
				<AKTableHeader classes="flex justify-around pr-4">
					<AKTableHeaderCell className="flex justify-center w-64">
						{translate().t("reactApp.sessions.time")}
					</AKTableHeaderCell>
					<AKTableHeaderCell className="flex justify-center w-32">
						{translate().t("reactApp.sessions.status")}
					</AKTableHeaderCell>
					<AKTableHeaderCell className="flex justify-center w-64">
						{translate().t("reactApp.sessions.sessionId")}
					</AKTableHeaderCell>
					<AKTableHeaderCell className="flex justify-center w-32">
						{translate().t("reactApp.sessions.actions")}
					</AKTableHeaderCell>
				</AKTableHeader>
				<List
					height={heightProp}
					width={widthProp}
					itemCount={sessions?.length || 0}
					itemSize={30}
					itemData={itemData as AKSessionsTableRowProps}
					onItemsRendered={handleItemsRendered}
					onScroll={handleScroll}
					itemKey={(index) => sessions?.[index]?.sessionId || 0}
					ref={listRef}
				>
					{AKSessionsTableRow}
				</List>
			</AKTable>
		</>
	);
};
