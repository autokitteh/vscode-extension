import { useEffect, useState } from "react";
import { DEFAULT_DEPLOYMENTS_PAGE_SIZE } from "@constants/deployments.view.constants";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import { DeploymentSectionViewModel } from "@models";
import { AKDeploymentState } from "@react-components";
import {
	AKTable,
	AKTableEmptyMessage,
	AKTableCell,
	AKTableHeader,
	AKTableRow,
	AKTableHeaderCell,
} from "@react-components/AKTable";
import { DeploymentState } from "@react-enums";
import { sendMessage } from "@react-utilities";
import { Deployment } from "@type/models";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import moment from "moment";

export const AKDeployments = ({ deployments, totalDeployments }: DeploymentSectionViewModel) => {
	const [rerender, setRerender] = useState(0);
	useEffect(() => {
		const interval = setInterval(() => {
			setRerender((rerender) => rerender + 1);
		}, 1000);

		return () => clearInterval(interval);
	}, []);
	useEffect(() => {
		if (totalDeployments && totalDeployments <= DEFAULT_DEPLOYMENTS_PAGE_SIZE) {
			setDeploymentsCount(totalDeployments);
		}
	}, [totalDeployments]);
	const isDeploymentStateStartable = (deploymentState: number) =>
		deploymentState === DeploymentState.INACTIVE_DEPLOYMENT ||
		deploymentState === DeploymentState.DRAINING_DEPLOYMENT;

	const [deploymentsCount, setDeploymentsCount] = useState<number>(DEFAULT_DEPLOYMENTS_PAGE_SIZE);

	const showMore = () => {
		if (!deployments || !totalDeployments) {
			return;
		}
		const calculateDeploymentsCount = Math.min(
			deployments.length + DEFAULT_DEPLOYMENTS_PAGE_SIZE,
			totalDeployments
		);
		setDeploymentsCount(calculateDeploymentsCount);
		sendMessage(MessageType.setDeploymentsPageSize, {
			startIndex: 0,
			endIndex: calculateDeploymentsCount,
		});
	};

	const showLess = () => {
		setDeploymentsCount(DEFAULT_DEPLOYMENTS_PAGE_SIZE);
		sendMessage(MessageType.setDeploymentsPageSize, {
			startIndex: 0,
			endIndex: DEFAULT_DEPLOYMENTS_PAGE_SIZE,
		});
	};

	return (
		<div className="mt-4">
			{deployments && !!totalDeployments && (
				<div className="flex justify-end mb-2 w-full">
					{deploymentsCount} {translate().t("reactApp.general.outOf")} {totalDeployments}
				</div>
			)}
			<AKTable>
				<AKTableHeader>
					<AKTableHeaderCell>{translate().t("reactApp.deployments.time")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.deployments.status")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.deployments.sessions")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.deployments.buildId")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.deployments.actions")}</AKTableHeaderCell>
				</AKTableHeader>
				{deployments &&
					deployments.map((deployment: Deployment) => (
						<AKTableRow key={deployment.deploymentId}>
							<AKTableCell>
								{moment(deployment.createdAt as unknown as string).fromNow()}
							</AKTableCell>
							<AKTableCell>
								<div className="flex justify-center">
									<AKDeploymentState deploymentState={deployment.state} />
								</div>
							</AKTableCell>
							<AKTableCell>0</AKTableCell>
							<AKTableCell>{deployment.buildId}</AKTableCell>
							<AKTableCell>
								{isDeploymentStateStartable(deployment.state) ? (
									<div className="codicon codicon-debug-start"></div>
								) : (
									<div className="codicon codicon-debug-stop"></div>
								)}
							</AKTableCell>
						</AKTableRow>
					))}
			</AKTable>
			{!deployments && (
				<AKTableEmptyMessage>{translate().t("reactApp.general.loading")}...</AKTableEmptyMessage>
			)}
			<div className="flex w-full justify-center mt-4">
				{!!deployments && !!totalDeployments && deploymentsCount < totalDeployments && (
					<VSCodeButton onClick={showMore} className="mr-1">
						{translate().t("reactApp.general.showMore")}
					</VSCodeButton>
				)}
				{!!deployments &&
					!!deployments.length &&
					deploymentsCount > DEFAULT_DEPLOYMENTS_PAGE_SIZE && (
						<VSCodeButton className="ml-1" onClick={showLess}>
							{translate().t("reactApp.general.showLess")}
						</VSCodeButton>
					)}
			</div>

			{deployments && deployments.length === 0 && (
				<AKTableEmptyMessage>No deployments found</AKTableEmptyMessage>
			)}
		</div>
	);
};

export default AKDeployments;
