import { MessageType } from "@enums";
import { translate } from "@i18n";
import { DeploymentSectionViewModel } from "@models";
import { HeaderCell, TableMessage } from "@react-components/atoms/table";
import { DeploymentTableHeader } from "@react-components/deployments/molecules";
import { DeploymentsTableBody } from "@react-components/deployments/organisms";
import { TableHeader } from "@react-components/molecules/table";
import { Table } from "@react-components/organisms";
import { useAppState } from "@react-context";
import { useIncomingMessageHandler } from "@react-hooks";
import { sendMessage } from "@react-utilities";
import { Deployment } from "@type/models";
import { useEffect, useState } from "react";

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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [deployments]);

	useEffect(() => {
		if (deploymentsSection) {
			setTotalDeployments(deploymentsSection.totalDeployments);
			setDeployments(deploymentsSection?.deployments);
			if (deploymentsSection?.selectedDeploymentId) {
				dispatch({ payload: deploymentsSection.selectedDeploymentId, type: "SET_SELECTED_DEPLOYMENT" });
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [deploymentsSection]);

	return (
		<div style={{ height }}>
			<Table>
				<TableHeader classes="bg-vscode-editor-background sticky top-0 h-8 text-left z-30">
					<HeaderCell className="pt-5 text-lg font-extralight" colSpan={8}>
						{`${translate().t("reactApp.deployments.tableTitle")} (${totalDeployments})`}
					</HeaderCell>
				</TableHeader>
				<DeploymentTableHeader />
				<DeploymentsTableBody deployments={deployments} />
			</Table>
			{isLoading && <TableMessage>{translate().t("reactApp.general.loading")}</TableMessage>}
			{deployments?.length === 0 && <TableMessage>{translate().t("reactApp.deployments.noDeployments")}</TableMessage>}
		</div>
	);
};
