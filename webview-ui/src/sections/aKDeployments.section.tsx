import { useEffect, useState } from "react";
import { pageLimits } from "@constants/projectsView.constants";
import { MessageType, ProjectViewSections } from "@enums";
import { translate } from "@i18n";
import { DeploymentSectionViewModel } from "@models";
import { AKDeploymentState } from "@react-components";
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
	const [selectDeployment, setSelectedDeployment] = useState("");

	useEffect(() => {
		if (deployments && isLoading) {
			setIsLoading(false);
		}
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
		pageLimits[ProjectViewSections.DEPLOYMENTS],
		totalDeployments,
		ProjectViewSections.DEPLOYMENTS
	);

	const getSessionsByDeploymentId = (deploymentId: string) => {
		sendMessage(MessageType.selectDeployment, deploymentId);
		setSelectedDeployment(deploymentId);
	};

	return (
		<div
			className="mt-4 min-h-48 max-h-48 overflow-y-auto overflow-x-hidden"
			onScroll={console.log}
		>
			{deployments && !!totalDeployments ? (
				<div className="flex justify-end mb-2 w-full min-h-[20px] sticky">
					{`${translate().t("reactApp.general.totalOf")} ${totalDeployments} ${translate().t(
						"reactApp.general.deployments"
					)}`}
				</div>
			) : (
				<div className="flex mb-2 w-full min-h-[20px]" />
			)}
			<AKTable>
				<AKTableHeader classes="sticky top-0">
					<AKTableHeaderCell>{translate().t("reactApp.deployments.time")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.deployments.status")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.deployments.sessions")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.deployments.buildId")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.deployments.actions")}</AKTableHeaderCell>
				</AKTableHeader>
				{deployments &&
					deployments.map((deployment: Deployment) => (
						<AKTableRow
							key={deployment.deploymentId}
							isSelected={selectDeployment === deployment.deploymentId}
						>
							<AKTableCell
								onClick={() => getSessionsByDeploymentId(deployment.deploymentId)}
								classes={["cursor-pointer"]}
							>
								{moment(deployment.createdAt as unknown as string).fromNow()}
							</AKTableCell>
							<AKTableCell
								onClick={() => getSessionsByDeploymentId(deployment.deploymentId)}
								classes={["cursor-pointer"]}
							>
								<div className="flex justify-center">
									<AKDeploymentState deploymentState={deployment.state} />
								</div>
							</AKTableCell>
							<AKTableCell
								onClick={() => getSessionsByDeploymentId(deployment.deploymentId)}
								classes={["cursor-pointer"]}
							>
								0
							</AKTableCell>
							<AKTableCell
								onClick={() => getSessionsByDeploymentId(deployment.deploymentId)}
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
		</div>
	);
};

export default AKDeployments;
