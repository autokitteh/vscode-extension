import { useEffect, useState } from "react";
import { DEFAULT_SESSIONS_PAGE_SIZE } from "@constants/sessions.view.constants";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import { SessionSectionViewModel } from "@models/views";
import {
	AKTable,
	AKTableMessage,
	AKTableCell,
	AKTableHeader,
	AKTableRow,
	AKTableHeaderCell,
} from "@react-components/AKTable";
import { sendMessage } from "@react-utilities";
import { Session } from "@type/models";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import moment from "moment";

export const AKSessions = ({ sessions, totalSessions }: SessionSectionViewModel) => {
	const [sessionsCount, setSessionsCount] = useState<number>(DEFAULT_SESSIONS_PAGE_SIZE);
	const [isLoading, setIsLoading] = useState(true);
	useEffect(() => {
		setIsLoading(false);
	}, [sessions]);

	useEffect(() => {
		if (totalSessions && totalSessions <= DEFAULT_SESSIONS_PAGE_SIZE) {
			setSessionsCount(totalSessions);
		}
	}, [totalSessions]);

	const showMore = () => {
		if (!sessions || !totalSessions) {
			return;
		}
		const sessionsCount = Math.min(sessions.length + DEFAULT_SESSIONS_PAGE_SIZE, totalSessions);
		setSessionsCount(sessionsCount);
		sendMessage(MessageType.setDeploymentsPageSize, {
			startIndex: 0,
			endIndex: sessionsCount,
		});
	};

	const showLess = () => {
		setSessionsCount(DEFAULT_SESSIONS_PAGE_SIZE);
		sendMessage(MessageType.setDeploymentsPageSize, {
			startIndex: 0,
			endIndex: DEFAULT_SESSIONS_PAGE_SIZE,
		});
	};

	return (
		<div className="mt-4">
			{sessions && !!totalSessions && (
				<div className="flex justify-end mb-2 w-full">
					{sessionsCount} {translate().t("reactApp.general.outOf")} {totalSessions}
				</div>
			)}
			<AKTable>
				<AKTableHeader>
					<AKTableHeaderCell>{translate().t("reactApp.sessions.time")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.sessions.sessionId")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.sessions.actions")}</AKTableHeaderCell>
				</AKTableHeader>
				{sessions &&
					sessions.map((session: Session) => (
						<AKTableRow key={session.sessionId}>
							<AKTableCell>{moment(session.createdAt as unknown as string).fromNow()}</AKTableCell>
							<AKTableCell>{session.sessionId}</AKTableCell>
							<AKTableCell>
								<div className="codicon codicon-stop"></div>
								<div className="codicon codicon-close"></div>
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
			<div className="flex w-full justify-center mt-4">
				{!!sessions && !!totalSessions && sessionsCount < totalSessions && (
					<VSCodeButton onClick={showMore} className="mr-1">
						{translate().t("reactApp.general.showMore")}
					</VSCodeButton>
				)}
				{!!sessions && !!sessions.length && sessionsCount > DEFAULT_SESSIONS_PAGE_SIZE && (
					<VSCodeButton className="ml-1" onClick={showLess}>
						{translate().t("reactApp.general.showLess")}
					</VSCodeButton>
				)}
			</div>
		</div>
	);
};

export default AKSessions;
