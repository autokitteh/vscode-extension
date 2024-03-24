import { useCallback, useEffect, useRef, useState } from "react";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import { Player } from "@lottiefiles/react-lottie-player";
import { SessionSectionViewModel } from "@models/views";
import loaderAnimation from "@react-assets/media/catto-loader.json";
import { AKButton, AKSessionState } from "@react-components";
import {
	AKTable,
	AKTableMessage,
	AKTableCell,
	AKTableHeader,
	AKTableRow,
	AKTableHeaderCell,
} from "@react-components/AKTable";
import { IIncomingSessionMessagesHandler } from "@react-interfaces";
import { getTimePassed, HandleIncomingSessionsMessages, sendMessage } from "@react-utilities";
import { cn } from "@react-utilities/cnClasses.utils";
import { Message } from "@type";
import { Session } from "@type/models";
import { usePopper } from "react-popper";

export const AKSessions = ({ sessions, totalSessions = 0 }: SessionSectionViewModel) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [rerender, setRerender] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedSessionId, setSelectedSessionId] = useState("");
	const deletePopperElement = useRef<HTMLDivElement | null>(null);
	const deleteRefElement = useRef<HTMLDivElement | null>(null);
	const [showDeletePopper, setShowDeletePopper] = useState(false);
	const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deletedError, setDeletedError] = useState(false);

	const setSelectedSession = (sessionId: string) => {
		setSelectedSessionId(sessionId);
		setDeletedError(false);
		setIsDeleting(false);
		setShowDeletePopper(false);
	};

	const handleDeploymentDeletedResponse = (isDeleted: boolean) => {
		if (isDeleted) {
			setShowDeletePopper(false);
			setIsDeleting(false);
			return;
		}
		setDeletedError(true);
		setIsDeleting(false);
	};

	const messageHandlers: IIncomingSessionMessagesHandler = {
		setSessionDeletedResponse: handleDeploymentDeletedResponse,
	};

	const handleMessagesFromExtension = useCallback(
		(event: MessageEvent<Message>) => HandleIncomingSessionsMessages(event, messageHandlers),
		[]
	);

	useEffect(() => {
		window.addEventListener("message", handleMessagesFromExtension);
		return () => {
			window.removeEventListener("message", handleMessagesFromExtension);
		};
	}, [handleMessagesFromExtension]);

	const toggleDeletePopper = (sessionId: string) => {
		if (deleteSessionId === sessionId) {
			setDeleteSessionId(null);
			setShowDeletePopper(false);
		} else {
			setDeleteSessionId(sessionId);
			setShowDeletePopper(true);
		}
	};

	useEffect(() => {
		if (isLoading) {
			setIsLoading(false);
		}
	}, [sessions]);
	useEffect(() => {
		const interval = setInterval(() => {
			setRerender((rerender) => rerender + 1);
		}, 1000);
		setIsDeleting(false);

		return () => clearInterval(interval);
	}, []);

	const displaySessionLogs = (sessionId: string) => {
		sendMessage(MessageType.displaySessionLogs, sessionId);
		setSelectedSession(sessionId);
	};

	const deleteSession = (sessionId: string) => {
		sendMessage(MessageType.deleteSession, sessionId);
		setIsDeleting(true);

		setShowDeletePopper(false);
	};

	const { attributes, styles } = usePopper(deleteRefElement.current, deletePopperElement.current, {
		placement: "bottom",
		modifiers: [
			{
				name: "offset",
				options: {
					offset: [0, 10],
				},
			},
		],
	});
	const popperClasses = cn(
		"flex-col z-30 bg-vscode-editor-background text-vscode-foreground",
		"border border-gray-300 p-4 rounded-lg shadow-lg",
		{ invisible: !showDeletePopper }
	);

	return (
		<div className="mt-4  h-[43vh] overflow-y-auto overflow-x-hidden">
			<div className="flex items-baseline">
				<h1 className="flex text-lg font-extralight mb-2">{translate().t("reactApp.sessions.tableTitle")}</h1>
				<div className="ml-1 text-lg font-extralight">({totalSessions})</div>
			</div>
			<AKTable>
				<AKTableHeader classes="sticky top-0">
					<AKTableHeaderCell>{translate().t("reactApp.sessions.time")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.sessions.status")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.sessions.sessionId")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.sessions.actions")}</AKTableHeaderCell>
				</AKTableHeader>
				{sessions &&
					sessions.map((session: Session) => (
						<AKTableRow key={session.sessionId} isSelected={selectedSessionId === session.sessionId}>
							<AKTableCell onClick={() => displaySessionLogs(session.sessionId)} classes={["cursor-pointer"]}>
								{getTimePassed(session.createdAt)}
							</AKTableCell>
							<AKTableCell onClick={() => displaySessionLogs(session.sessionId)} classes={["cursor-pointer"]}>
								<AKSessionState sessionState={session.state} />
							</AKTableCell>
							<AKTableCell onClick={() => displaySessionLogs(session.sessionId)} classes={["cursor-pointer"]}>
								{session.sessionId}
							</AKTableCell>
							<AKTableCell classes={["cursor-pointer"]}>
								<div className="codicon codicon-output" onClick={() => displaySessionLogs(session.sessionId)}></div>
								<div
									className="codicon codicon-trash"
									onClick={(e) => {
										const refElement = e.currentTarget;
										toggleDeletePopper(session.sessionId);
										deleteRefElement.current = refElement;
									}}
									ref={deleteRefElement}
								></div>

								<div ref={deletePopperElement} style={styles.popper} {...attributes.popper} className={popperClasses}>
									<div
										className={cn("flex justify-center items-center h-full w-full", {
											hidden: !isDeleting,
										})}
									>
										<Player src={loaderAnimation} className="player" loop autoplay />
									</div>
									<div
										className={cn({
											hidden: isDeleting,
										})}
									>
										<div className="mb-3 text-left">
											<strong className="mb-2">{translate().t("reactApp.sessions.deletionApprovalQuestion")}</strong>
											<br />
											<div className="mb-2">{translate().t("reactApp.sessions.deletionApprovalQuestionSubtitle")}</div>
										</div>
										{deletedError && (
											<div className="text-red-500 text-left">
												{translate().t("reactApp.sessions.errorDeletingLine1")}
												<br />
												{translate().t("reactApp.sessions.errorDeletingLine2")}
											</div>
										)}
										<div className="flex">
											<AKButton
												classes="bg-vscode-editor-background text-vscode-foreground"
												onClick={() => setShowDeletePopper(false)}
											>
												{translate().t("reactApp.general.no")}
											</AKButton>
											<div className="flex-grow" />
											<AKButton onClick={() => deleteSession(session.sessionId)}>
												{translate().t("reactApp.general.yes")}
											</AKButton>
										</div>
									</div>
								</div>
							</AKTableCell>
						</AKTableRow>
					))}
			</AKTable>
			{isLoading && <AKTableMessage>{translate().t("reactApp.general.loading")}</AKTableMessage>}
			{!sessions && !isLoading && (
				<AKTableMessage>{translate().t("reactApp.sessions.pickDeploymentToShowSessions")}</AKTableMessage>
			)}
			{sessions && sessions.length === 0 && (
				<AKTableMessage>{translate().t("reactApp.sessions.noSessionsFound")}</AKTableMessage>
			)}
		</div>
	);
};

export default AKSessions;
