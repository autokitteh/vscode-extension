import { useEffect, useState } from "react";
import { pageLimits } from "@constants/projectsView.constants";
import { MessageType, PaginationListEntity } from "@enums";
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
import { usePagination } from "@react-hooks";
import { sendMessage } from "@react-utilities";
import { Session } from "@type/models";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import moment from "moment";

export const AKSessions = ({ sessions, totalSessions = 0 }: SessionSectionViewModel) => {
	const [rerender, setRerender] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	useEffect(() => {
		setIsLoading(false);
	}, [sessions]);
	useEffect(() => {
		const interval = setInterval(() => {
			setRerender((rerender) => rerender + 1);
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	const { endIndex, showMore, showLess } = usePagination(
		pageLimits[PaginationListEntity.SESSIONS],
		totalSessions,
		PaginationListEntity.SESSIONS
	);

	return (
		<div className="mt-4">
			{sessions && !!totalSessions && (
				<div className="flex justify-end mb-2 w-full">
					{endIndex} {translate().t("reactApp.general.outOf")} {totalSessions}
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
				{!!sessions && !!totalSessions && endIndex < totalSessions && (
					<VSCodeButton onClick={showMore} className="mr-1">
						{translate().t("reactApp.general.showMore")}
					</VSCodeButton>
				)}
				{!!sessions &&
					!!sessions.length &&
					endIndex > pageLimits[PaginationListEntity.SESSIONS] && (
						<VSCodeButton className="ml-1" onClick={showLess}>
							{translate().t("reactApp.general.showLess")}
						</VSCodeButton>
					)}
			</div>
		</div>
	);
};

export default AKSessions;
