import { useEffect, useState } from "react";
import { translate } from "@i18n";
import {
	AKTable,
	AKTableMessage,
	AKTableCell,
	AKTableHeader,
	AKTableRow,
	AKTableHeaderCell,
} from "@react-components/AKTable";
import { Session } from "@type/models";
import moment from "moment";

export const AKSessions = ({ sessions }: { sessions: Session[] | undefined }) => {
	const [isLoading, setIsLoading] = useState(true);
	useEffect(() => {
		setIsLoading(false);
	}, [sessions]);

	return (
		<div>
			<AKTable classes="mt-4">
				<AKTableHeader>
					<AKTableHeaderCell>{translate().t("reactApp.sessions.time")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.sessions.sessionId")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.sessions.actions")}</AKTableHeaderCell>
				</AKTableHeader>
				{sessions &&
					sessions.map((session) => (
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
			{sessions && sessions.length === 0 && <AKTableMessage>No sessions found</AKTableMessage>}
		</div>
	);
};

export default AKSessions;
