import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import { HeaderCell } from "@react-components/atoms/table";
import { TableHeader } from "@react-components/molecules";
import { MonacoEditorModal, Table } from "@react-components/organisms";
import { SessionsTableRow } from "@react-components/sessions/organisms";
import { useAppDispatch, useAppState } from "@react-context";
import { SessionState } from "@react-enums";
import { useCloseOnEscape } from "@react-hooks";
import { SessionsTableRowProps } from "@react-types";
import { sendMessage, getSessionActions } from "@react-utilities";
import { Deployment, Session } from "@type/models";
import { createPortal } from "react-dom";
import { FixedSizeList as List, ListOnItemsRenderedProps, ListOnScrollProps } from "react-window";

export const SessionsTableBody = ({
	sessions,
	selectedSession,
	setSelectedSession,
	heightProp,
	widthProp,
	disableLiveTail,
	liveTailState,
	lastDeployment,
}: {
	sessions?: Session[];
	selectedSession?: string;
	setSelectedSession: (sessionId: string) => void;
	heightProp: string | number;
	widthProp: string | number;
	disableLiveTail: () => void;
	liveTailState: boolean;
	lastDeployment?: Deployment;
}) => {
	// State Section
	const [{ modalName }] = useAppState();
	const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
	const deletePopperElementRef = useRef<HTMLDivElement | null>(null);
	const [inputsModalVisible, setInputsModalVisible] = useState(false);
	const [sessionInputs, setSessionInputs] = useState<string>();
	const { setModalName } = useAppDispatch();
	const listRef = useRef<List>(null);

	// Hooks Section
	useCloseOnEscape(() => setInputsModalVisible(false));

	// Local variable
	const deleteSessionPopperTranslations = {
		title: translate().t("reactApp.sessions.deletionApprovalQuestion"),
		subtitle: translate().t("reactApp.sessions.deletionApprovalQuestionSubtitle"),
	};

	// Functions Section

	const displayInputsModal = (sessionInputs: string) => {
		setSessionInputs(sessionInputs);
		setInputsModalVisible(true);
	};

	const showPopper = () => setModalName("sessionDelete");
	const hidePopper = () => setModalName("");

	const displaySessionLogs = (sessionId: string) => {
		sendMessage(MessageType.displaySessionLogsAndStop, sessionId);
		disableLiveTail();
		setSelectedSession(sessionId);
	};

	const deleteSessionConfirmed = () => {
		sendMessage(MessageType.deleteSession, deleteSessionId);
		hidePopper();
	};

	const deleteSessionDismissed = () => {
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
			deleteSessionConfirmed,
			deleteSessionDismissed,
			deleteSessionPopperTranslations,
			deletePopperElementRef,
		}),
		[sessions, selectedSession, lastDeployment, modalName]
	);

	return (
		<>
			{inputsModalVisible &&
				createPortal(
					<MonacoEditorModal content={sessionInputs} onClose={() => setInputsModalVisible(false)} />,
					document.body
				)}
			<Table>
				<TableHeader classes="flex justify-around pr-4">
					<HeaderCell className="flex justify-center w-64">{translate().t("reactApp.sessions.time")}</HeaderCell>
					<HeaderCell className="flex justify-center w-32">{translate().t("reactApp.sessions.status")}</HeaderCell>
					<HeaderCell className="flex justify-center w-64">{translate().t("reactApp.sessions.sessionId")}</HeaderCell>
					<HeaderCell className="flex justify-center w-32">{translate().t("reactApp.sessions.actions")}</HeaderCell>
				</TableHeader>
				<List
					height={heightProp}
					width={widthProp}
					itemCount={sessions?.length || 0}
					itemSize={30}
					itemData={itemData as SessionsTableRowProps}
					onItemsRendered={handleItemsRendered}
					onScroll={handleScroll}
					itemKey={(index) => sessions?.[index]?.sessionId || 0}
					ref={listRef}
				>
					{SessionsTableRow}
				</List>
			</Table>
		</>
	);
};
