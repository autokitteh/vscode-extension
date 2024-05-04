import { useEffect, useState } from "react";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import { DeploymentSectionViewModel } from "@models";
import { AKDeploymentTableBody, AKDeploymentTableHeader } from "@react-components";
import { AKTable, AKTableHeader, AKTableHeaderCell, AKTableMessage } from "@react-components/AKTable";
import { useAppState } from "@react-context";
import { useIncomingMessageHandler } from "@react-hooks";
import { sendMessage } from "@react-utilities";
import { Deployment } from "@type/models";

export const AKDeployments = ({ height }: { height: string | number }) => {
	const [deploymentsSection, setDeploymentsSection] = useState<DeploymentSectionViewModel>();
	const [totalDeployments, setTotalDeployments] = useState<number>();
	const [deployments, setDeployments] = useState<Deployment[]>();
	const [{ loading }, dispatch] = useAppState();

	const isLoading = loading.has(MessageType.getDeployments);

	useIncomingMessageHandler({
		setDeploymentsSection,
	});

	useEffect(() => {
		sendMessage(MessageType.loadInitialDataOnceViewReady);
	}, []);

	useEffect(() => {
		if (deployments && deployments.length) {
			dispatch({ type: "SET_LAST_DEPLOYMENT", payload: deployments[0] });
		}
		if (deployments && isLoading) {
			dispatch({ type: "STOP_LOADER", payload: MessageType.getDeployments });
		}
	}, [deployments]);

	useEffect(() => {
		if (deploymentsSection) {
			setTotalDeployments(deploymentsSection.totalDeployments);
			setDeployments(deploymentsSection?.deployments);
		}
	}, [deploymentsSection]);

	return (
		<div style={{ height }}>
			<AKTable>
				<AKTableHeader classes="bg-vscode-editor-background sticky top-0 h-8 text-left z-30">
					<AKTableHeaderCell className="text-lg font-extralight pt-5" colSpan={8}>
						{`${translate().t("reactApp.deployments.tableTitle")} (${totalDeployments})`}
					</AKTableHeaderCell>
				</AKTableHeader>
				<AKDeploymentTableHeader />
				<AKDeploymentTableBody deployments={deployments} />
			</AKTable>
			{(isLoading || !deployments) && <AKTableMessage>{translate().t("reactApp.general.loading")}</AKTableMessage>}
			{deployments && deployments.length === 0 && (
				<AKTableMessage>{translate().t("reactApp.deployments.noDeployments")}</AKTableMessage>
			)}
		</div>
	);
};

export default AKDeployments;
