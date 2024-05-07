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
	const [isLoading, setIsLoading] = useState(true);
	const [, dispatch] = useAppState();

	useIncomingMessageHandler({
		setDeploymentsSection,
	});

	useEffect(() => {
		sendMessage(MessageType.loadInitialDataOnceViewReady);
	}, []);

	useEffect(() => {
		if (deployments && isLoading) {
			setIsLoading(false);
		}
	}, [deployments]);

	useEffect(() => {
		if (deploymentsSection) {
			setTotalDeployments(deploymentsSection.totalDeployments);
			setDeployments(deploymentsSection?.deployments);
			if (deploymentsSection?.selectedDeploymentId) {
				dispatch({ type: "SET_SELECTED_DEPLOYMENT", payload: deploymentsSection.selectedDeploymentId });
			}
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
