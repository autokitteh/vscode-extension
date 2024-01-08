import { useEffect, useState } from "react";
import { pageLimits } from "@constants/projectsView.constants";
import { MessageType, ProjectViewSections } from "@enums";
import { translate } from "@i18n";
import { SessionSectionViewModel } from "@models/views";
import { AKButton } from "@react-components";
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
import moment from "moment";

export const AKSessions = ({ sessions, totalSessions = 0 }: SessionSectionViewModel) => {
	const [rerender, setRerender] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
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

	const { endIndex, showMore, showLess } = usePagination(
		pageLimits[ProjectViewSections.SESSIONS],
		totalSessions,
		ProjectViewSections.SESSIONS
	);

	const displaySessionLogs = (sessionId: string) => {
		console.log("displaySessionLogs", sessionId);

		sendMessage(MessageType.displaySessionStats, sessionId);
	};

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
							<AKTableCell onClick={() => displaySessionLogs(session.sessionId)}>
								<div className="codicon codicon-output"></div>
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
					<AKButton onClick={showMore} classes="mr-1">
						{translate().t("reactApp.general.showMore")}
					</AKButton>
				)}
				{!!sessions && !!sessions.length && endIndex > pageLimits[ProjectViewSections.SESSIONS] && (
					<AKButton classes="ml-1" onClick={showLess}>
						{translate().t("reactApp.general.showLess")}
					</AKButton>
				)}
			</div>
		</div>
	);
};

export default AKSessions;
