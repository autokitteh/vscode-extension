import { useCallback, useEffect, useRef, useState } from "react";
import { MessageType, SessionStateType } from "@enums";
import { translate } from "@i18n";
import { Player } from "@lottiefiles/react-lottie-player";
import { DeploymentSectionViewModel } from "@models";
import loaderAnimation from "@react-assets/media/catto-loader.json";
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
import { IIncomingDeploymentsMessagesHandler } from "@react-interfaces";
import { HandleIncomingDeploymentsMessages, getTimePassed, sendMessage } from "@react-utilities";
import { cn } from "@react-utilities/cnClasses.utils";
import { Message } from "@type";
import { Deployment } from "@type/models";
import { usePopper } from "react-popper";

export const AKDeployments = ({
	deployments,
	totalDeployments = 0,
	selectedDeploymentId,
}: DeploymentSectionViewModel) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [rerender, setRerender] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedDeployment, setSelectedDeployment] = useState("");
	const [isDeletingInProccess, setIsDeletingInProgress] = useState(false);
	const [deleteDeploymentId, setDeleteDeploymentId] = useState<string | null>(null);

	const popperEl = useRef<HTMLDivElement | null>(null);
	const referenceEl = useRef<HTMLDivElement | null>(null);
	const [showPopper, setShowPopper] = useState(false);
	const [deletedDeploymentError, setDeletedDeploymentError] = useState(false);

	const handleDeploymentDeletedResponse = (isDeleted: boolean) => {
		setIsDeletingInProgress(false);
		if (isDeleted) {
			setShowPopper(false);
			setDeletedDeploymentError(false);
			return;
		}
		setDeletedDeploymentError(true);
	};

	const messageHandlers: IIncomingDeploymentsMessagesHandler = {
		handleDeploymentDeletedResponse,
	};

	const handleMessagesFromExtension = useCallback(
		(event: MessageEvent<Message>) => HandleIncomingDeploymentsMessages(event, messageHandlers),
		[]
	);

	const hideDeletePopper = () => {
		setIsDeletingInProgress(false);
		setDeleteDeploymentId("");
		setShowPopper(false);
	};

	useEffect(() => {
		window.addEventListener("message", handleMessagesFromExtension);
		return () => {
			window.removeEventListener("message", handleMessagesFromExtension);
		};
	}, [handleMessagesFromExtension]);

	const { attributes, styles } = usePopper(referenceEl.current, popperEl.current, {
		placement: "bottom",
		modifiers: [
			{
				name: "offset",
				options: {
					offset: [0, 10],
				},
			},
		],
	});

	const popperClasses = cn(
		"flex-col z-30 bg-vscode-editor-background text-vscode-foreground",
		"border border-gray-300 p-4 rounded-lg shadow-lg",
		{ invisible: !showPopper }
	);
	const toggleDeletePopper = (deploymentId: string) => {
		if (deleteDeploymentId === deploymentId) {
			setDeleteDeploymentId(null);
			setShowPopper(false);
		} else {
			setDeleteDeploymentId(deploymentId);
			setShowPopper(true);
		}
	};

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
		setIsDeletingInProgress(false);
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

	const deleteDeploymentAction = (isApproved: boolean) => {
		if (isApproved) {
			sendMessage(MessageType.deleteDeployment, deleteDeploymentId);
			setIsDeletingInProgress(true);
			return;
		}
		setIsDeletingInProgress(false);
		setDeletedDeploymentError(false);
		setShowPopper(false);
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
								<div
									className="codicon codicon-trash cursor-pointer ml-2"
									onClick={(e) => {
										const refElement = e.currentTarget;
										toggleDeletePopper(deployment.deploymentId);
										referenceEl.current = refElement;
									}}
									ref={referenceEl}
								></div>

								{showPopper && (
									<div className="absolute h-screen w-screen top-0 left-0" onClick={() => hideDeletePopper()}></div>
								)}
								<div
									ref={popperEl}
									style={{ ...styles.popper, width: "10%" }}
									{...attributes.popper}
									className={popperClasses}
								>
									<div
										className={cn("flex justify-center items-center h-full w-full", {
											hidden: !isDeletingInProccess,
										})}
									>
										<Player src={loaderAnimation} className="player" loop autoplay />
									</div>
									<div
										className={cn({
											hidden: isDeletingInProccess,
										})}
									>
										<div className="mb-3 text-left">
											<strong className="mb-2">{translate().t("reactApp.deployments.deletionApprovalQuestion")}</strong>
											<div className="mb-2">
												{translate().t("reactApp.deployments.deletionApprovalQuestionSubtitle")}
											</div>
										</div>
										{deletedDeploymentError && (
											<div className="text-red-500 text-left">
												{translate().t("reactApp.deployments.errorDeletingDeploymentLine1")}
												<br />
												{translate().t("reactApp.deployments.errorDeletingDeploymentLine2")}
											</div>
										)}
										<div className="flex">
											<AKButton
												classes="bg-vscode-editor-background text-vscode-foreground"
												onClick={() => deleteDeploymentAction(false)}
											>
												{translate().t("reactApp.general.no")}
											</AKButton>
											<div className="flex-grow" />
											<AKButton onClick={() => deleteDeploymentAction(true)}>
												{translate().t("reactApp.general.yes")}
											</AKButton>
										</div>
									</div>
								</div>
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
