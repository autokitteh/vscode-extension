import { useEffect, useRef, useState } from "react";
import { MessageType, SessionStateType } from "@enums";
import { translate } from "@i18n";
import { SessionSectionViewModel } from "@models/views";
import { AKSessionsTableBody } from "@react-components/aKSessionTableBody.component";
import { AKTable, AKTableHeader, AKTableHeaderCell, AKTableMessage } from "@react-components/AKTable";
import { useIncomingMessageHandler, useForceRerender } from "@react-hooks";
import { sendMessage } from "@react-utilities";

export const AKSessions = ({ height }: { height: string | number }) => {
	const [isLoading, setIsLoading] = useState(true);
	const [sessionsSection, setSessionsSection] = useState<SessionSectionViewModel | undefined>();
	const [selectedSession, setSelectedSession] = useState<string | undefined>("");
	const [stateFilter, setStateFilter] = useState<string>();

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

	const filterSessions = (value: string) => {
		setStateFilter(value);
		if (value === "all") {
			sendMessage(MessageType.setSessionsStateFilter, undefined);
			return;
		}
		sendMessage(MessageType.setSessionsStateFilter, value);
	};

	const [divHeight, setDivHeight] = useState(0);
	const [divWidth, setDivWidth] = useState(0);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setDivHeight(ref?.current?.clientHeight || 0);
		setDivWidth(ref?.current?.clientWidth || 0);
	});

	return (
		<div style={{ height: `${parseInt(height as string, 10) * 0.7}px` }} ref={ref}>
			<AKTable>
				<AKTableHeader classes="bg-vscode-editor-background sticky top-0 h-8 text-left z-30">
					<AKTableHeaderCell className="text-lg font-extralight pt-5" colSpan={3}>
						{`${translate().t("reactApp.sessions.tableTitle")} (${totalSessions})`}
					</AKTableHeaderCell>
					<AKTableHeaderCell className="flex justify-end text-xs font-extralight pt-3">
						<div className="codicon codicon-filter text-xs mr-1" />
						<select
							className="text-white bg-black rounded"
							onChange={(value) => filterSessions(value.target.value)}
							value={stateFilter}
						>
							<option value="all">All</option>
							{(Object.keys(SessionStateType) as Array<keyof typeof SessionStateType>).map((sessionState) => (
								<option value={sessionState}>{capitalizeFirstLetter(sessionState)}</option>
							))}
						</select>
					</AKTableHeaderCell>
				</AKTableHeader>
				<AKSessionsTableBody
					sessions={sessions}
					selectedSession={selectedSession}
					setSelectedSession={setSelectedSession}
					heightProp={divHeight}
					widthProp={divWidth}
					totalSessions={totalSessions!}
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
