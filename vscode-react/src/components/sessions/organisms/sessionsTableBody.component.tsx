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
import { getSessionActions, sendMessage } from "@react-utilities";
import { Deployment, Session } from "@type/models";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FixedSizeList as List, ListOnItemsRenderedProps } from "react-window";

export const SessionsTableBody = ({
	heightProp,
	lastDeployment,
	selectedSession,
	sessions,
	setSelectedSession,
	widthProp,
}: {
	heightProp: string | number;
	lastDeployment?: Deployment;
	selectedSession?: string;
	sessions?: Session[];
	setSelectedSession: (sessionId: string) => void;
	widthProp: string | number;
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
		subtitle: translate().t("reactApp.sessions.deletionApprovalQuestionSubtitle"),
		title: translate().t("reactApp.sessions.deletionApprovalQuestion"),
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
		setModalName("sessionOutputs");
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
		if (session.state === SessionState.RUNNING || session.state === SessionState.STOPPED) {
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleItemsRendered = ({ visibleStopIndex }: ListOnItemsRenderedProps) => {
		if (visibleStopIndex >= (sessions?.length || 0) - 1) {
			sendMessage(MessageType.loadMoreSessions);

			return;
		}
	};

	const sessionActions = {
		displayInputsModal,
		displaySessionDeletePopper,
		...getSessionActions(lastDeployment!),
	};

	const itemData = useMemo(
		() => ({
			deletePopperElementRef,
			deleteSessionConfirmed,
			deleteSessionDismissed,
			deleteSessionPopperTranslations,
			displaySessionLogs,
			hidePopper,
			modalName,
			selectedSessionId: selectedSession,
			sessionActions,
			sessions,
		}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
					<HeaderCell className="flex w-64 justify-center">{translate().t("reactApp.sessions.time")}</HeaderCell>
					<HeaderCell className="flex w-32 justify-center">{translate().t("reactApp.sessions.status")}</HeaderCell>
					<HeaderCell className="flex w-64 justify-center">{translate().t("reactApp.sessions.sessionId")}</HeaderCell>
					<HeaderCell className="flex w-32 justify-center">{translate().t("reactApp.sessions.actions")}</HeaderCell>
				</TableHeader>
				<List
					height={heightProp}
					itemCount={sessions?.length || 0}
					itemData={itemData as SessionsTableRowProps}
					itemKey={(index) => sessions?.[index]?.sessionId || 0}
					itemSize={30}
					onItemsRendered={handleItemsRendered}
					ref={listRef}
					width={widthProp}
				>
					{SessionsTableRow}
				</List>
			</Table>
		</>
	);
};
