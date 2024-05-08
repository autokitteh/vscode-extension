import { useEffect, useRef, useState } from "react";
import { MessageType, SessionStateType } from "@enums";
import { translate } from "@i18n";
import { SessionSectionViewModel } from "@models/views";
import RotateIcon from "@react-assets/icons/rotate.svg?react";
import { AKSessionsTableBody } from "@react-components/aKSessionTableBody.component";
import { AKTableMessage } from "@react-components/AKTable";
import { useAppState } from "@react-context";
import { useIncomingMessageHandler, useForceRerender } from "@react-hooks";
import { sendMessage } from "@react-utilities";

export const AKSessions = ({ height }: { height: string | number }) => {
	const [sessionsSection, setSessionsSection] = useState<SessionSectionViewModel | undefined>();
	const [selectedSession, setSelectedSession] = useState<string | undefined>("");
	const [stateFilter, setStateFilter] = useState<string>();
	const [liveTailState, setLiveTailState] = useState<boolean>(true);
	const [{ delayedLoading }] = useAppState();

	const { sessions, showLiveTail, lastDeployment } = sessionsSection || {};

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

	const disableLiveTail = () => {
		setLiveTailState(false);
		sendMessage(MessageType.toggleSessionsLiveTail, false);
	};

	const toggleLiveTail = () => {
		setLiveTailState(!liveTailState);
		sendMessage(MessageType.toggleSessionsLiveTail, !liveTailState);
	};

	return (
		<div style={{ height: `${parseInt(height as string, 10) * 0.85}px` }} ref={ref}>
			<div
				className={
					"flex flex-row w-full h-12 bg-vscode-editor-background sticky top-0 " +
					"text-left z-30 text-lg font-extralight items-center"
				}
			>
				<div className="flex">{`${translate().t("reactApp.sessions.tableTitle")}`}</div>
				{!delayedLoading && showLiveTail ? (
					<div
						className="ml-3 w-5 h-5 cursor-pointer"
						onClick={() => toggleLiveTail()}
						title={
							liveTailState
								? translate().t("reactApp.sessions.pauseLiveTail")
								: translate().t("reactApp.sessions.resumeLiveTail")
						}
					>
						<RotateIcon fill={liveTailState ? "green" : "gray"} />
					</div>
				) : null}
				<div className="flex-grow" />
				<div className="flex w-1/3 text-xs justify-end">
					<div className="codicon codicon-filter h-6 mr-2 mt-1" />
					<select
						className="text-white bg-black rounded h-6 mr-2"
						onChange={(value) => filterSessions(value.target.value)}
						value={stateFilter}
					>
						<option value="all">All</option>
						{(Object.keys(SessionStateType) as Array<keyof typeof SessionStateType>).map((sessionState) => (
							<option value={sessionState}>{capitalizeFirstLetter(sessionState)}</option>
						))}
					</select>
				</div>
			</div>
			{delayedLoading && <AKTableMessage>{translate().t("reactApp.general.loading")}</AKTableMessage>}
			{!sessions && !delayedLoading && (
				<AKTableMessage>{translate().t("reactApp.sessions.pickDeploymentToShowSessions")}</AKTableMessage>
			)}
			{sessions && sessions.length === 0 && (
				<AKTableMessage>{translate().t("reactApp.sessions.noSessionsFound")}</AKTableMessage>
			)}
			{!!sessions?.length && (
				<AKSessionsTableBody
					sessions={sessions}
					selectedSession={selectedSession}
					setSelectedSession={setSelectedSession}
					heightProp={divHeight}
					widthProp={divWidth}
					disableLiveTail={disableLiveTail}
					liveTailState={liveTailState}
					lastDeployment={lastDeployment}
				/>
			)}
		</div>
	);
};

export default AKSessions;
