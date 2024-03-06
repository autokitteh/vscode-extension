import { useEffect, useState } from "react";
import { MessageType, SessionStateType } from "@enums";
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
import { getTimePassed, sendMessage } from "@react-utilities";
import { Deployment } from "@type/models";

export const AKDeployments = ({
	deployments,
	totalDeployments = 0,
	selectedDeploymentId,
}: DeploymentSectionViewModel) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [rerender, setRerender] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedDeployment, setSelectedDeployment] = useState("");

	useEffect(() => {
		if (typeof selectedDeploymentId === "string") {
			setSelectedDeployment(selectedDeploymentId);
		}
	}, [selectedDeploymentId]);

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
		deploymentState === DeploymentState.INACTIVE_DEPLOYMENT || deploymentState === DeploymentState.DRAINING_DEPLOYMENT;

	const getSessionsByDeploymentId = (deploymentId: string) => {
		sendMessage(MessageType.selectDeployment, deploymentId);
		setSelectedDeployment(deploymentId);
	};

	const getSessionStateCount = (deployment: Deployment, state: string) => {
		if (!deployment.sessionStats) {
			return translate().t("reactApp.general.unknown");
		}
		const session = deployment.sessionStats.find((s) => s.state === state);
		return session ? session.count : 0;
	};

	const deactivateBuild = (deploymentId: string) => {
		sendMessage(MessageType.deactivateDeployment, deploymentId);
	};

	const activateBuild = (deploymentId: string) => {
		sendMessage(MessageType.activateDeployment, deploymentId);
	};

	return (
		<div className="mt-4 h-[43vh] overflow-y-auto overflow-x-hidden">
			{deployments && !!totalDeployments ? (
				<div className="flex justify-end mb-2 w-full min-h-[20px] sticky">
					{`${translate().t("reactApp.general.totalOf")} ${totalDeployments} ${translate().t(
						"reactApp.general.deployments"
					)}`}
				</div>
			) : (
				<div className="flex mb-2 w-full min-h-[20px]" />
			)}
			<h1 className="text-lg font-extralight mb-2">{translate().t("reactApp.deployments.tableTitle")}</h1>
			<AKTable>
				<AKTableHeader classes="sticky top-0">
					<AKTableHeaderCell>{translate().t("reactApp.deployments.time")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.deployments.status")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.sessions.statuses.running")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.sessions.statuses.error")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.sessions.statuses.completed")}</AKTableHeaderCell>

					<AKTableHeaderCell>{translate().t("reactApp.deployments.buildId")}</AKTableHeaderCell>
					<AKTableHeaderCell>{translate().t("reactApp.deployments.actions")}</AKTableHeaderCell>
				</AKTableHeader>
				{deployments &&
					deployments.map((deployment: Deployment) => (
						<AKTableRow key={deployment.deploymentId} isSelected={selectedDeployment === deployment.deploymentId}>
							<AKTableCell
								onClick={() => getSessionsByDeploymentId(deployment.deploymentId)}
								classes={["cursor-pointer"]}
							>
								{getTimePassed(deployment.createdAt)}
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
								{getSessionStateCount(deployment, SessionStateType.running)}
							</AKTableCell>
							<AKTableCell
								onClick={() => getSessionsByDeploymentId(deployment.deploymentId)}
								classes={["cursor-pointer"]}
							>
								{getSessionStateCount(deployment, SessionStateType.error)}
							</AKTableCell>
							<AKTableCell
								onClick={() => getSessionsByDeploymentId(deployment.deploymentId)}
								classes={["cursor-pointer"]}
							>
								{getSessionStateCount(deployment, SessionStateType.completed)}
							</AKTableCell>
							<AKTableCell
								onClick={() => getSessionsByDeploymentId(deployment.deploymentId)}
								classes={["cursor-pointer"]}
							>
								{deployment.buildId}
							</AKTableCell>
							<AKTableCell>
								{isDeploymentStateStartable(deployment.state) ? (
									<div
										className="codicon codicon-debug-start cursor-pointer text-green-500"
										onClick={() => activateBuild(deployment.deploymentId)}
									></div>
								) : (
									<div
										className="codicon codicon-debug-stop cursor-pointer text-red-500"
										onClick={() => deactivateBuild(deployment.deploymentId)}
									></div>
								)}
							</AKTableCell>
						</AKTableRow>
					))}
			</AKTable>
			{(isLoading || !deployments) && <AKTableMessage>{translate().t("reactApp.general.loading")}</AKTableMessage>}
			{deployments && deployments.length === 0 && (
				<AKTableMessage>{translate().t("reactApp.deployments.noDeployments")}</AKTableMessage>
			)}
		</div>
	);
};

export default AKDeployments;
