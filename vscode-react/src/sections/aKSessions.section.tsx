import { useEffect, useState } from "react";
import { translate } from "@i18n";
import { SessionSectionViewModel } from "@models/views";
import { AKMonacoEditorModal, AKOverlay, AKSessionsTableHeader } from "@react-components";
import { AKSessionsTableBody } from "@react-components/aKSessionTableBody.component";
import { AKTable, AKTableMessage } from "@react-components/AKTable";
import { useCloseOnEscape, useIncomingMessageHandler, useForceRerender } from "@react-hooks";

export const AKSessions = ({ height }) => {
	const [inputsModalVisible, setInputsModalVisible] = useState(false);

	const [isLoading, setIsLoading] = useState(true);
	const [sessionInputs, setSessionInputs] = useState<string>();
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

	useCloseOnEscape(() => setInputsModalVisible(false));
	useForceRerender();

	const displayInputsModal = (sessionInputs: string) => {
		setSessionInputs(sessionInputs);
		setInputsModalVisible(true);
	};

	return (
		<div className="mt-4" style={{ height: height }}>
			<div className="flex items-baseline">
				<h1 className="flex text-lg font-extralight mb-2">{translate().t("reactApp.sessions.tableTitle")}</h1>
				<div className="ml-1 text-lg font-extralight">({totalSessions})</div>
			</div>
			<AKTable>
				<AKSessionsTableHeader />
				<AKSessionsTableBody
					displayInputsModal={displayInputsModal}
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
			<AKOverlay isVisibile={inputsModalVisible} onOverlayClick={() => setInputsModalVisible(false)} />

			{inputsModalVisible && <AKMonacoEditorModal content={sessionInputs} setModal={setInputsModalVisible} />}
		</div>
	);
};

export default AKSessions;
