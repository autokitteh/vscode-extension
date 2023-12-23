import { Session } from "@ak-proto-ts/sessions/v1/session_pb";
import {
	AKTable,
	AKTableEmptyMessage,
	AKTableCell,
	AKTableHeader,
	AKTableRow,
	AKTableHeaderCell,
} from "@components/AKTable";
import { translate } from "@i18n/index";
import moment from "moment";

export const AKSessions = ({ sessions }: { sessions: Session[] | undefined }) => {
	return (
		<div>
			<AKTable classes="mt-4">
				<AKTableHeader>
					<AKTableHeaderCell>{translate().t("reactAppSessions.time")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactAppSessions.actions")}</AKTableHeaderCell>
				</AKTableHeader>
				{sessions &&
					sessions.map((session) => (
						<AKTableRow key={session.sessionId}>
							<AKTableCell>{moment(session.createdAt as unknown as string).fromNow()}</AKTableCell>
							<AKTableCell>
								<div className="codicon codicon-stop"></div>
								<div className="codicon codicon-close"></div>
							</AKTableCell>
						</AKTableRow>
					))}
			</AKTable>
			{!sessions && <AKTableEmptyMessage>Loading...</AKTableEmptyMessage>}
			{sessions && sessions.length === 0 && (
				<AKTableEmptyMessage>No sessions found</AKTableEmptyMessage>
			)}
		</div>
	);
};

export default AKSessions;
