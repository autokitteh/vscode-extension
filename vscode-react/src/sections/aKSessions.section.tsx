import { useEffect, useState } from "react";
import { translate } from "@i18n";
import { SessionSectionViewModel } from "@models/views";
import { AKMonacoEditorModal, AKOverlay, AKSessionsTableHeader } from "@react-components";
import { AKSessionsTableBody } from "@react-components/aKSessionTableBody.component";
import { AKTable, AKTableHeader, AKTableHeaderCell, AKTableMessage } from "@react-components/AKTable";
import { useCloseOnEscape, useIncomingMessageHandler, useForceRerender } from "@react-hooks";
import { createPortal } from "react-dom";

export const AKSessions = ({ height }: { height: string | number }) => {
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
		<div style={{ height }}>
			<AKTable>
				<AKTableHeader classes="bg-vscode-editor-background sticky top-0 h-8 text-left z-40">
					<AKTableHeaderCell className="text-lg font-extralight pt-5" colSpan={8}>
						{`${translate().t("reactApp.sessions.tableTitle")} (${totalSessions})`}
					</AKTableHeaderCell>
				</AKTableHeader>
				<AKSessionsTableHeader />
				<AKSessionsTableBody
					sessions={sessions}
					displayInputsModal={displayInputsModal}
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

			{inputsModalVisible &&
				createPortal(
					<AKMonacoEditorModal content={sessionInputs} hideModal={() => setInputsModalVisible(false)} />,
					document.body
				)}
		</div>
	);
};

export default AKSessions;
