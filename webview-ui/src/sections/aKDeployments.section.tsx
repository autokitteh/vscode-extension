import { useEffect, useState } from "react";
import { pageLimits } from "@constants/projectsView.constants";
import { MessageType, PaginationListEntity } from "@enums";
import { translate } from "@i18n";
import { DeploymentSectionViewModel } from "@models";
import { AKButton, AKDeploymentState } from "@react-components";
import {
	AKTable,
	AKTableMessage,
	AKTableCell,
	AKTableHeader,
	AKTableRow,
	AKTableHeaderCell,
} from "@react-components/AKTable";
import { DeploymentState } from "@react-enums";
import { usePagination } from "@react-hooks";
import { sendMessage } from "@react-utilities";
import { Deployment } from "@type/models";
import moment from "moment";

export const AKDeployments = ({
	deployments,
	totalDeployments = 0,
}: DeploymentSectionViewModel) => {
	const [rerender, setRerender] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	useEffect(() => {
		setIsLoading(false);
	}, [deployments]);
	useEffect(() => {
		const interval = setInterval(() => {
			setRerender((rerender) => rerender + 1);
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	const isDeploymentStateStartable = (deploymentState: number) =>
		deploymentState === DeploymentState.INACTIVE_DEPLOYMENT ||
		deploymentState === DeploymentState.DRAINING_DEPLOYMENT;

	const { endIndex, showMore, showLess } = usePagination(
		pageLimits[PaginationListEntity.DEPLOYMENTS],
		totalDeployments,
		PaginationListEntity.DEPLOYMENTS
	);

	const revealSessionsPerDeploymentId = (deploymentId: string) =>
		sendMessage(MessageType.selectDeployment, deploymentId);

	return (
		<div className="mt-4">
			{deployments && !!totalDeployments && (
				<div className="flex justify-end mb-2 w-full">
					{endIndex} {translate().t("reactApp.general.outOf")} {totalDeployments}
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
							<AKTableCell
								onClick={() => revealSessionsPerDeploymentId(deployment.deploymentId)}
								classes={["cursor-pointer"]}
							>
								{moment(deployment.createdAt as unknown as string).fromNow()}
							</AKTableCell>
							<AKTableCell
								onClick={() => revealSessionsPerDeploymentId(deployment.deploymentId)}
								classes={["cursor-pointer"]}
							>
								<div className="flex justify-center">
									<AKDeploymentState deploymentState={deployment.state} />
								</div>
							</AKTableCell>
							<AKTableCell
								onClick={() => revealSessionsPerDeploymentId(deployment.deploymentId)}
								classes={["cursor-pointer"]}
							>
								0
							</AKTableCell>
							<AKTableCell
								onClick={() => revealSessionsPerDeploymentId(deployment.deploymentId)}
								classes={["cursor-pointer"]}
							>
								{deployment.buildId}
							</AKTableCell>
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
			{(isLoading || !deployments) && (
				<AKTableMessage>{translate().t("reactApp.general.loading")}</AKTableMessage>
			)}
			{deployments && deployments.length === 0 && (
				<AKTableMessage>{translate().t("reactApp.deployments.noDeployments")}</AKTableMessage>
			)}
			<div className="flex w-full justify-center mt-4">
				{!!deployments && !!totalDeployments && endIndex < totalDeployments && (
					<AKButton onClick={showMore} classes="mr-1">
						{translate().t("reactApp.general.showMore")}
					</AKButton>
				)}
				{!!deployments &&
					!!deployments.length &&
					endIndex > pageLimits[PaginationListEntity.DEPLOYMENTS] && (
						<AKButton classes="ml-1" onClick={showLess}>
							{translate().t("reactApp.general.showLess")}
						</AKButton>
					)}
			</div>
		</div>
	);
};

export default AKDeployments;
