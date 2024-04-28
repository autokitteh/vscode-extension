import React, { CSSProperties, memo, RefObject, useCallback, useEffect, useRef, useState } from "react";
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
import { FixedSizeList as List, ListOnItemsRenderedProps, ListOnScrollProps, areEqual } from "react-window";

const Row = memo(
	({
		data,
		index,
		style,
	}: {
		data: {
			sessions: Session[];
			selectedSessionId: string;
			displaySessionLogs: (sessionId: string) => void;
			isLastDeployment: (deploymentId: string) => boolean;
			startSession: (session: Session) => void;
			getStopSessionClass: (sessionState: SessionState) => string;
			stopSession: (session: Session) => void;
			displayInputsModal: (sessionInputs: string) => void;
			isRunning: (sessionState: SessionState) => boolean;
			displaySessionDeletePopper: (event: React.MouseEvent<HTMLDivElement>, session: Session) => void;
			modalName: string;
			hidePopper: () => void;
			isDeletingInProcess: boolean;
			deleteSessionConfirmed: () => void;
			deleteSessionDismissed: () => void;
			deleteSessionPopperTranslations: {
				title: string;
				subtitle: string;
			};
			deletePopperElementRef: RefObject<HTMLDivElement>;
		};
		index: number;
		style: CSSProperties;
	}) => {
		const {
			sessions,
			selectedSessionId,
			displaySessionLogs,
			isLastDeployment,
			startSession,
			getStopSessionClass,
			stopSession,
			displayInputsModal,
			isRunning,
			displaySessionDeletePopper,
			modalName,
			hidePopper,
			isDeletingInProcess,
			deleteSessionConfirmed,
			deleteSessionDismissed,
			deleteSessionPopperTranslations,
			deletePopperElementRef,
		} = data;
		const session = sessions[index];
		const isSelectedRow = selectedSessionId === session?.sessionId;
		return (
			session && (
				<div style={style} className="w-full">
					<AKTableRow className="flex justify-around" isSelected={isSelectedRow}>
						<AKTableCell classes={["cursor-pointer"]} onClick={() => displaySessionLogs(session.sessionId)}>
							{getTimePassed(session.createdAt)}
						</AKTableCell>
						<AKTableCell classes={["cursor-pointer"]} onClick={() => displaySessionLogs(session.sessionId)}>
							<AKSessionState sessionState={session.state} />
						</AKTableCell>
						<AKTableCell classes={["cursor-pointer w-1/5"]} onClick={() => displaySessionLogs(session.sessionId)}>
							{session.sessionId}
						</AKTableCell>
						<AKTableCell>
							{isLastDeployment(session.deploymentId) && (
								<div
									className="codicon codicon-debug-rerun mr-2 cursor-pointer"
									title={translate().t("reactApp.sessions.startSession")}
									onClick={() => startSession(session)}
								></div>
							)}
							<div
								className={getStopSessionClass(session.state)}
								title={translate().t("reactApp.sessions.stopSession")}
								onClick={() => stopSession(session)}
							></div>
							{isLastDeployment(session.deploymentId) && (
								<div
									className="codicon codicon-symbol-namespace mr-2 cursor-pointer"
									title={translate().t("reactApp.sessions.showSessionProps")}
									onClick={() => displayInputsModal(JSON.stringify(session.inputs, null, 2))}
								></div>
							)}
							<div
								className={`codicon codicon-trash mr-2 z-20 ${
									isRunning(session.state) ? "cursor-not-allowed" : "cursor-pointer"
								}`}
								title={
									isRunning(session.state)
										? translate().t("reactApp.sessions.deleteSessionDisabled")
										: translate().t("reactApp.sessions.delete")
								}
								onClick={(event) => displaySessionDeletePopper(event, session)}
							></div>
							{createPortal(
								<div>
									<AKOverlay
										isVisibile={modalName === "sessionDelete" && index === 0}
										onOverlayClick={() => hidePopper()}
									/>

									<PopperComponent visible={modalName === "sessionDelete"} referenceRef={deletePopperElementRef}>
										<DeletePopper
											isDeletingInProcess={isDeletingInProcess}
											onConfirm={() => deleteSessionConfirmed()}
											onDismiss={() => deleteSessionDismissed()}
											translations={deleteSessionPopperTranslations}
										/>
									</PopperComponent>
								</div>,
								document.body
							)}
						</AKTableCell>
					</AKTableRow>
				</div>
			)
		);
	},
	areEqual
);

const getItemData = memoizeOne(
	(
		selectedSessionId,
		sessions,
		displaySessionLogs,
		isLastDeployment,
		startSession,
		getStopSessionClass,
		stopSession,
		displayInputsModal,
		isRunning,
		displaySessionDeletePopper,
		modalName,
		hidePopper,
		isDeletingInProcess,
		deleteSessionConfirmed,
		deleteSessionDismissed,
		deleteSessionPopperTranslations,
		deletePopperElementRef
	) => ({
		selectedSessionId,
		sessions,
		displaySessionLogs,
		isLastDeployment,
		startSession,
		getStopSessionClass,
		stopSession,
		displayInputsModal,
		isRunning,
		displaySessionDeletePopper,
		modalName,
		hidePopper,
		isDeletingInProcess,
		deleteSessionConfirmed,
		deleteSessionDismissed,
		deleteSessionPopperTranslations,
		deletePopperElementRef,
	})
);

export const AKSessionsTableBody = ({
	sessions,
	selectedSession,
	setSelectedSession,
	heightProp,
	widthProp,
	totalSessions,
}: {
	sessions?: Session[];
	selectedSession?: string;
	setSelectedSession: (sessionId: string) => void;
	heightProp: string | number;
	widthProp: string | number;
	totalSessions: number;
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

	const handleItemsRendered = ({ visibleStopIndex }: ListOnItemsRenderedProps) => {
		console.log("visibleStopIndex", visibleStopIndex);
		console.log("sessions.length", sessions?.length);

		if (visibleStopIndex >= (sessions?.length || 0) - 1 && (sessions?.length || 0) === totalSessions) {
			// Load more items when close to the end
			console.log("Load more items");

			sendMessage(MessageType.loadMoreSessions);
		}
	};

	const handleScroll = useCallback(({ scrollOffset }: ListOnScrollProps) => {
		console.log("scrollOffset", scrollOffset);

		if (scrollOffset === 0) {
			console.log("Scrolled to the top - do something");
		}
	}, []);

	console.log("heightProp", heightProp);

	const itemData = getItemData(
		selectedSession,
		sessions || [],
		displaySessionLogs,
		isLastDeployment,
		startSession,
		getStopSessionClass,
		stopSession,
		displayInputsModal,
		isRunning,
		displaySessionDeletePopper,
		modalName,
		hidePopper,
		isDeletingInProcess,
		deleteSessionConfirmed,
		deleteSessionDismissed,
		deleteSessionPopperTranslations,
		deletePopperElementRef
	);

	return (
		<>
			{inputsModalVisible &&
				createPortal(
					<AKMonacoEditorModal content={sessionInputs} onCloseClicked={() => setInputsModalVisible(false)} />,
					document.body
				)}
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
					onScroll={handleScroll}
					itemKey={(index) => sessions?.[index]?.sessionId || 0}
				>
					{Row}
				</List>
			</AKTable>
		</>
	);
};
