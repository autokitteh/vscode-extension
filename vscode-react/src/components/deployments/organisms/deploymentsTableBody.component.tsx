import { DeploymentState, MessageType, SessionStateType } from "@enums";
import { translate } from "@i18n";
import { Overlay } from "@react-components/atoms";
import { Cell } from "@react-components/atoms/table";
import { DeploymentStateLabel, ManualRunPopper } from "@react-components/deployments";
import { DeletePopper, Popper } from "@react-components/molecules";
import { Row } from "@react-components/molecules/table";
import { useAppState } from "@react-context/appState.context";
import { useIncomingMessageHandler } from "@react-hooks";
import { getTimePassed, sendMessage } from "@react-utilities";
import { Deployment } from "@type/models";
import React, { MouseEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export const DeploymentsTableBody = ({ deployments }: { deployments?: Deployment[] }) => {
	// State Hooks Section
	const [{ modalName }, dispatch] = useAppState();
	const executePopperElementRef = useRef<HTMLDivElement | null>(null);
	const deletePopperElementRef = useRef<HTMLDivElement | null>(null);
	const [selectedFile, setSelectedFile] = useState<string>("");
	const [selectedFunction, setSelectedFunction] = useState<string>("");
	const [files, setFiles] = useState<string[]>([]);
	const [deleteDeploymentId, setDeleteDeploymentId] = useState<string | null>(null);
	const [displayedErrors, setDisplayedErrors] = useState<Record<string, boolean>>({});
	const [selectedDeploymentId, setSelectedDeploymentId] = useState<string>();
	const [entrypoints, setEntrypoints] = useState<string[]>();

	// Local variable
	const deleteDeploymentPopperTranslations = {
		subtitle: translate().t("reactApp.deployments.deletionApprovalQuestionSubtitle"),
		title: translate().t("reactApp.deployments.deletionApprovalQuestion"),
	};

	useEffect(() => {
		if (selectedDeploymentId) {
			dispatch({ payload: selectedDeploymentId, type: "SET_SELECTED_DEPLOYMENT" });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedDeploymentId]);

	useIncomingMessageHandler({ setEntrypoints, setSelectedDeploymentId });

	const showPopper = (event: MouseEvent<HTMLElement>, popperId: string) => {
		event.stopPropagation();
		dispatch({ payload: popperId, type: "SET_MODAL_NAME" });
	};
	const hidePopper = () => dispatch({ payload: "", type: "SET_MODAL_NAME" });

	const isDeploymentStateStartable = (deploymentState: number) =>
		deploymentState === DeploymentState.INACTIVE_DEPLOYMENT || deploymentState === DeploymentState.DRAINING_DEPLOYMENT;

	const getSessionStateCount = (deployment: Deployment, state: string) => {
		if (!deployment.sessionStats) {
			return translate().t("reactApp.general.unknown");
		}
		const session = deployment.sessionStats.find((s) => s.state === state);

		return session ? session.count : 0;
	};

	const handleFunctionChange = (event: string) => {
		setSelectedFunction(event);
	};

	const deactivateBuild = (deploymentId: string) => {
		sendMessage(MessageType.deactivateDeployment, deploymentId);
	};

	const activateBuild = (deploymentId: string) => {
		sendMessage(MessageType.activateDeployment, deploymentId);
	};

	const getSessionsByDeploymentId = (deploymentId: string) => {
		sendMessage(MessageType.selectDeployment, deploymentId);
	};

	const isActive = (deploymentState: DeploymentState) => deploymentState === DeploymentState.ACTIVE_DEPLOYMENT;
	const isLastDeployment = (deploymentId: string) => deploymentId === deployments?.[0]?.deploymentId;

	const startSession = (params: Record<string, string>) => {
		const lastDeployment = deployments![0];

		setDisplayedErrors({});

		if (!selectedFile || !selectedFunction) {
			if (!selectedFile) {
				setDisplayedErrors({ ...displayedErrors, selectedFile: true });
			}
			if (!selectedFunction) {
				setDisplayedErrors({ ...displayedErrors, selectedFunction: true });
			}

			return;
		}

		const startSessionArgs = {
			buildId: lastDeployment.buildId,
			deploymentId: lastDeployment.deploymentId,
			fileName: selectedFile,
			functionName: selectedFunction,
			inputs: params,
		};

		sendMessage(MessageType.startSession, startSessionArgs);
		hidePopper();
	};

	const deleteDeploymentConfirmed = () => {
		sendMessage(MessageType.deleteDeployment, deleteDeploymentId);
		hidePopper();
	};

	const deleteDeploymentDismissed = () => {
		setDeleteDeploymentId("");
		hidePopper();
	};

	const showDeleteDeploymentPopper = (event: React.MouseEvent<HTMLDivElement>, deployment: Deployment) => {
		event.stopPropagation();
		if (deployment.state === DeploymentState.ACTIVE_DEPLOYMENT) {
			sendMessage(MessageType.displayErrorWithoutActionButton, translate().t("reactApp.deployments.deleteDisabled"));

			return;
		}
		const refElement = event.currentTarget;

		showPopper(event, "deploymentDelete");
		deletePopperElementRef.current = refElement;
		setDeleteDeploymentId(deployment.deploymentId);
	};

	// useEffects Section
	useEffect(() => {
		hidePopper();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (entrypoints && Object.keys(entrypoints).length) {
			setFiles(entrypoints);
			setSelectedFile(entrypoints[0]);
		}
	}, [entrypoints]);

	return (
		deployments &&
		deployments.map((deployment: Deployment, index: number) => (
			<Row
				isSelected={selectedDeploymentId === deployment.deploymentId}
				key={deployment.deploymentId}
				onClick={() => getSessionsByDeploymentId(deployment.deploymentId)}
			>
				<Cell classes={["cursor-pointer"]}>{getTimePassed(deployment.createdAt)}</Cell>
				<Cell classes={["cursor-pointer"]}>
					<div className="flex justify-center">
						<DeploymentStateLabel deploymentState={deployment.state} />
					</div>
				</Cell>
				<Cell classes={["cursor-pointer"]}>{getSessionStateCount(deployment, SessionStateType.stopped)}</Cell>
				<Cell classes={["cursor-pointer"]}>{getSessionStateCount(deployment, SessionStateType.running)}</Cell>
				<Cell classes={["cursor-pointer"]}>{getSessionStateCount(deployment, SessionStateType.error)}</Cell>
				<Cell classes={["cursor-pointer"]}>{getSessionStateCount(deployment, SessionStateType.completed)}</Cell>
				<Cell classes={["cursor-pointer"]}>{deployment.buildId}</Cell>
				<Cell classes={["z-40"]}>
					<div className="flex justify-center">
						<div
							className={`codicon codicon-debug-rerun mr-2 cursor-pointer 
							${isLastDeployment(deployment.deploymentId) ? "" : "invisible"}`}
							onClick={(event) => showPopper(event, "deploymentExecute")}
							ref={isLastDeployment(deployment.deploymentId) ? executePopperElementRef : null}
							title={translate().t("reactApp.deployments.execute")}
						></div>
						{isDeploymentStateStartable(deployment.state) ? (
							<div
								className="codicon codicon-debug-start cursor-pointer text-green-500"
								onClick={() => activateBuild(deployment.deploymentId)}
								title={translate().t("reactApp.deployments.activate")}
							></div>
						) : (
							<div
								className="codicon codicon-debug-stop cursor-pointer text-red-500"
								onClick={() => deactivateBuild(deployment.deploymentId)}
								title={translate().t("reactApp.deployments.deactivate")}
							></div>
						)}
						<div
							className={`codicon codicon-trash relative ${
								isActive(deployment.state) ? "cursor-not-allowed" : "cursor-pointer"
							} z-20 ml-2`}
							onClick={(event) => showDeleteDeploymentPopper(event, deployment)}
							title={
								isActive(deployment.state)
									? translate().t("reactApp.deployments.deleteDisabled")
									: translate().t("reactApp.deployments.delete")
							}
						></div>
					</div>
					{createPortal(
						<div>
							<Overlay
								isVisibile={index === 0 && (modalName === "deploymentDelete" || modalName === "deploymentExecute")}
								onOverlayClick={() => hidePopper()}
							/>
							<Popper referenceRef={deletePopperElementRef} visible={modalName === "deploymentDelete"}>
								<DeletePopper
									onConfirm={() => deleteDeploymentConfirmed()}
									onDismiss={() => deleteDeploymentDismissed()}
									translations={deleteDeploymentPopperTranslations}
								/>
							</Popper>
							<Popper
								className="w-1/2"
								referenceRef={executePopperElementRef}
								visible={modalName === "deploymentExecute"}
							>
								<ManualRunPopper
									displayedErrors={displayedErrors}
									files={files}
									functionName={selectedFunction}
									onClose={() => hidePopper()}
									onFileChange={setSelectedFile}
									onFunctionChange={handleFunctionChange}
									onStartSession={startSession}
									selectedFile={selectedFile}
								/>
							</Popper>
						</div>,
						document.body
					)}
				</Cell>
			</Row>
		))
	);
};
