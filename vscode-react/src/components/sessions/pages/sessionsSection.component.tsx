import { useEffect, useRef, useState } from "react";

import { MessageType, SessionStateType } from "@enums";
import { translate } from "@i18n";
import { SessionSectionViewModel } from "@models/views";
import { TableMessage } from "@react-components/atoms/table";
import { SessionsTableBody } from "@react-components/sessions/organisms";
import { useIncomingMessageHandler, useForceRerender } from "@react-hooks";
import { sendMessage } from "@react-utilities";

export const SessionsSection = ({ height }: { height: string | number }) => {
	const [sessionsSection, setSessionsSection] = useState<SessionSectionViewModel | undefined>();
	const [selectedSession, setSelectedSession] = useState<string | undefined>("");
	const [stateFilter, setStateFilter] = useState<string>();
	const { sessions, lastDeployment } = sessionsSection || {};

	useIncomingMessageHandler({
		setSessionsSection,
		setSelectedSession,
	});

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
		<div style={{ height: `${parseInt(height as string, 10) * 0.85}px` }} ref={ref}>
			<div
				className={
					"flex flex-row w-full h-12 bg-vscode-editor-background sticky top-0 " +
					"text-left z-30 text-lg font-extralight items-center"
				}
			>
				<div className="flex">{`${translate().t("reactApp.sessions.tableTitle")}`}</div>
				<div className="flex-grow" />
				<div className="flex w-1/3 text-xs justify-end items-center">
					<div className="codicon codicon-filter h-6 mt-2 mr-2" />
					<select
						className="text-white bg-black rounded h-6 mr-2"
						onChange={(value) => filterSessions(value.target.value)}
						value={stateFilter}
					>
						<option value="all">All</option>
						{(Object.keys(SessionStateType) as Array<keyof typeof SessionStateType>).map((sessionState) => (
							<option key={sessionState} value={sessionState}>
								{capitalizeFirstLetter(sessionState)}
							</option>
						))}
					</select>
				</div>
			</div>
			{!sessions && <TableMessage>{translate().t("reactApp.sessions.pickDeploymentToShowSessions")}</TableMessage>}
			{sessions && sessions.length === 0 && (
				<TableMessage>{translate().t("reactApp.sessions.noSessionsFound")}</TableMessage>
			)}
			{!!sessions?.length && (
				<SessionsTableBody
					sessions={sessions}
					selectedSession={selectedSession}
					setSelectedSession={setSelectedSession}
					heightProp={divHeight}
					widthProp={divWidth}
					lastDeployment={lastDeployment}
				/>
			)}
		</div>
	);
};
