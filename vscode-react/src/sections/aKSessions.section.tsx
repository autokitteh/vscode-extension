import { useEffect, useState } from "react";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import { SessionSectionViewModel } from "@models/views";
import { AKSessionState } from "@react-components";
import {
	AKTable,
	AKTableMessage,
	AKTableCell,
	AKTableHeader,
	AKTableRow,
	AKTableHeaderCell,
} from "@react-components/AKTable";
import { getTimePassed, sendMessage } from "@react-utilities";
import { Session } from "@type/models";

export const AKSessions = ({ sessions, totalSessions = 0 }: SessionSectionViewModel) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [rerender, setRerender] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedSession, setSelectedSession] = useState("");

	useEffect(() => {
		if (isLoading) {
			setIsLoading(false);
		}
	}, [sessions]);
	useEffect(() => {
		const interval = setInterval(() => {
			setRerender((rerender) => rerender + 1);
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	const displaySessionLogs = (sessionId: string) => {
		sendMessage(MessageType.displaySessionLogs, sessionId);
		setSelectedSession(sessionId);
	};

	return (
		<div className="mt-4 min-h-48 max-h-48 overflow-y-auto overflow-x-hidden">
			{sessions && !!totalSessions ? (
				<div className="flex justify-end mb-2 w-full min-h-[20px] sticky">
					{`${translate().t("reactApp.general.totalOf")} ${totalSessions} ${translate().t(
						"reactApp.general.sessions"
					)}`}
				</div>
			) : (
				<div className="mb-2 w-full min-h-[20px]" />
			)}
			<AKTable>
				<AKTableHeader classes="sticky top-0">
					<AKTableHeaderCell>{translate().t("reactApp.sessions.time")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.sessions.status")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.sessions.sessionId")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.sessions.actions")}</AKTableHeaderCell>
				</AKTableHeader>
				{sessions &&
					sessions.map((session: Session) => (
						<AKTableRow key={session.sessionId} isSelected={selectedSession === session.sessionId}>
							<AKTableCell
								onClick={() => displaySessionLogs(session.sessionId)}
								classes={["cursor-pointer"]}
							>
								{getTimePassed(session.createdAt)}
							</AKTableCell>
							<AKTableCell
								onClick={() => displaySessionLogs(session.sessionId)}
								classes={["cursor-pointer"]}
							>
								<AKSessionState sessionState={session.state} />
							</AKTableCell>
							<AKTableCell
								onClick={() => displaySessionLogs(session.sessionId)}
								classes={["cursor-pointer"]}
							>
								{session.sessionId}
							</AKTableCell>
							<AKTableCell
								onClick={() => displaySessionLogs(session.sessionId)}
								classes={["cursor-pointer"]}
							>
								<div
									className="codicon codicon-output"
									onClick={() => displaySessionLogs(session.sessionId)}
								></div>
							</AKTableCell>
						</AKTableRow>
					))}
			</AKTable>
			{isLoading && <AKTableMessage>{translate().t("reactApp.general.loading")}</AKTableMessage>}
			{!sessions && !isLoading && (
				<AKTableMessage>
					{translate().t("reactApp.sessions.pickDeploymentToShowSessions")}
				</AKTableMessage>
			)}
			{sessions && sessions.length === 0 && (
				<AKTableMessage>{translate().t("reactApp.sessions.noSessionsFound")}</AKTableMessage>
			)}
		</div>
	);
};

export default AKSessions;
