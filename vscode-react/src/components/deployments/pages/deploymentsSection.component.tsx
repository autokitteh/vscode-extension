import { useEffect, useState } from "react";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import { DeploymentSectionViewModel } from "@models";
import { DeploymentTableBody, DeploymentTableHeader } from "@react-components";
import { Table, TableHeader, TableHeaderCell, TableMessage } from "@react-components/Table";
import { useAppState } from "@react-context";
import { useIncomingMessageHandler } from "@react-hooks";
import { sendMessage } from "@react-utilities";
import { Deployment } from "@type/models";

export const DeploymentsSection = ({ height }: { height: string | number }) => {
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
			<Table>
				<TableHeader classes="bg-vscode-editor-background sticky top-0 h-8 text-left z-30">
					<TableHeaderCell className="text-lg font-extralight pt-5" colSpan={8}>
						{`${translate().t("reactApp.deployments.tableTitle")} (${totalDeployments})`}
					</TableHeaderCell>
				</TableHeader>
				<DeploymentTableHeader />
				<DeploymentTableBody deployments={deployments} />
			</Table>
			{(isLoading || !deployments) && <TableMessage>{translate().t("reactApp.general.loading")}</TableMessage>}
			{deployments && deployments.length === 0 && (
				<TableMessage>{translate().t("reactApp.deployments.noDeployments")}</TableMessage>
			)}
		</div>
	);
};

export default Deployments;
