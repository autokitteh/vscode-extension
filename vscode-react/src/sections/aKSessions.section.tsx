import { useEffect, useState } from "react";
import { MessageType, SessionStateType } from "@enums";
import { translate } from "@i18n";
import { SessionSectionViewModel } from "@models/views";
import { AKSessionsTableHeader } from "@react-components";
import { AKSessionsTableBody } from "@react-components/aKSessionTableBody.component";
import { AKTable, AKTableHeader, AKTableHeaderCell, AKTableMessage } from "@react-components/AKTable";
import { useIncomingMessageHandler, useForceRerender } from "@react-hooks";
import { sendMessage } from "@react-utilities";

export const AKSessions = ({ height }: { height: string | number }) => {
	const [isLoading, setIsLoading] = useState(true);
	const [sessionsSection, setSessionsSection] = useState<SessionSectionViewModel | undefined>();
	const [selectedSession, setSelectedSession] = useState<string | undefined>("");

	const { sessions, totalSessions } = sessionsSection || {};

	useIncomingMessageHandler({
		setSessionsSection,
		setSelectedSession,
	});

	useEffect(() => {
		if (isLoading) {
			setIsLoading(false);
		}
	}, [sessions]);

	useForceRerender();

	const capitalizeFirstLetter = (str: string) => {
		return str.charAt(0).toUpperCase() + str.slice(1);
	};

	const filterSessions = (value: any) => {
		sendMessage(MessageType.setSessionsStateFilter, value);
	};

	return (
		<div style={{ height }}>
			<AKTable>
				<AKTableHeader classes="bg-vscode-editor-background sticky top-0 h-8 text-left z-30">
					<AKTableHeaderCell className="text-lg font-extralight pt-5" colSpan={4}>
						{`${translate().t("reactApp.sessions.tableTitle")} (${totalSessions})`}
					</AKTableHeaderCell>
					<AKTableHeaderCell className="flex justify-end text-xs font-extralight pt-3">
						<div className="codicon codicon-filter text-xs mr-1" />
						<select
							className="text-white bg-black rounded"
							onChange={(value) => filterSessions(value.target.value)}
							disabled={totalSessions === 0}
						>
							<option value={undefined}>All</option>
							{(Object.keys(SessionStateType) as Array<keyof typeof SessionStateType>).map((sessionState) => (
								<option value={sessionState}>{capitalizeFirstLetter(sessionState)}</option>
							))}
						</select>
					</AKTableHeaderCell>
				</AKTableHeader>
				<AKSessionsTableHeader />
				<AKSessionsTableBody
					sessions={sessions}
					selectedSession={selectedSession}
					setSelectedSession={setSelectedSession}
				/>
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
