import React, { CSSProperties, memo, RefObject, useCallback, useEffect, useRef, useState } from "react";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import {
	AKMonacoEditorModal,
	AKOverlay,
	AKSessionActions,
	AKSessionState,
	DeletePopper,
	PopperComponent,
} from "@react-components";
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
			sessionActions: {
				startSession: (session: Session) => void;
				stopSession: (session: Session) => void;
				displayInputsModal: (sessionInputs: string) => void;
				displaySessionDeletePopper: (event: React.MouseEvent<HTMLDivElement>, session: Session) => void;
				isRunning: (sessionState: SessionState) => boolean;
				getStopSessionClass: (sessionState: SessionState) => string;
				isLastDeployment: (deploymentId: string) => boolean;
			};
			selectedSessionId: string;
			displaySessionLogs: (sessionId: string) => void;
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
			sessionActions,
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
							<AKSessionActions session={session} {...sessionActions} />
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
		sessionActions: {
			startSession: (session: Session) => void;
			stopSession: (session: Session) => void;
			displayInputsModal: (sessionInputs: string) => void;
			displaySessionDeletePopper: (event: React.MouseEvent<HTMLDivElement>, session: Session) => void;
			isRunning: (sessionState: SessionState) => boolean;
			getStopSessionClass: (sessionState: SessionState) => string;
			isLastDeployment: (deploymentId: string) => boolean;
		},
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
		sessionActions,
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
	onScroll,
}: {
	sessions?: Session[];
	selectedSession?: string;
	setSelectedSession: (sessionId: string) => void;
	heightProp: string | number;
	widthProp: string | number;
	totalSessions: number;
	onScroll: () => void;
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
		sendMessage(MessageType.displaySessionLogsAndStop, sessionId);
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
			onScroll();

			sendMessage(MessageType.loadMoreSessions);
		}
	};

	const handleScroll = useCallback(({ scrollOffset }: ListOnScrollProps) => {
		if (scrollOffset === 0) {
			console.log("Scrolled to the top - do something");
		}
	}, []);

	const sessionActions = {
		startSession,
		stopSession,
		displayInputsModal,
		displaySessionDeletePopper,
		isRunning,
		getStopSessionClass,
		isLastDeployment,
	};

	const itemData = getItemData(
		selectedSession,
		sessions || [],
		displaySessionLogs,
		sessionActions,
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
