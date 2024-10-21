import React, { useEffect, useRef, useState, MouseEvent } from "react";

import { createPortal } from "react-dom";

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
		title: translate().t("reactApp.deployments.deletionApprovalQuestion"),
		subtitle: translate().t("reactApp.deployments.deletionApprovalQuestionSubtitle"),
	};

	useEffect(() => {
		if (selectedDeploymentId) {
			dispatch({ type: "SET_SELECTED_DEPLOYMENT", payload: selectedDeploymentId });
		}
	}, [selectedDeploymentId]);

	useIncomingMessageHandler({ setSelectedDeploymentId, setEntrypoints });

	const showPopper = (event: MouseEvent<HTMLElement>, popperId: string) => {
		event.stopPropagation();
		dispatch({ type: "SET_MODAL_NAME", payload: popperId });
	};
	const hidePopper = () => dispatch({ type: "SET_MODAL_NAME", payload: "" });

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
			functionName: selectedFunction,
			fileName: selectedFile,
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
	}, []);

	useEffect(() => {
		if (entrypoints && Object.keys(entrypoints).length) {
			setFiles(entrypoints);
			setSelectedFile(Object.keys(entrypoints)[0]);
		}
	}, [entrypoints]);

	return (
		deployments &&
		deployments.map((deployment: Deployment, index: number) => (
			<Row
				key={deployment.deploymentId}
				isSelected={selectedDeploymentId === deployment.deploymentId}
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
							ref={isLastDeployment(deployment.deploymentId) ? executePopperElementRef : null}
							title={translate().t("reactApp.deployments.execute")}
							onClick={(event) => showPopper(event, "deploymentExecute")}
						></div>
						{isDeploymentStateStartable(deployment.state) ? (
							<div
								className="codicon codicon-debug-start cursor-pointer text-green-500"
								title={translate().t("reactApp.deployments.activate")}
								onClick={() => activateBuild(deployment.deploymentId)}
							></div>
						) : (
							<div
								className="codicon codicon-debug-stop cursor-pointer text-red-500"
								title={translate().t("reactApp.deployments.deactivate")}
								onClick={() => deactivateBuild(deployment.deploymentId)}
							></div>
						)}
						<div
							className={`relative codicon codicon-trash ${
								isActive(deployment.state) ? "cursor-not-allowed" : "cursor-pointer"
							} ml-2 z-20`}
							title={
								isActive(deployment.state)
									? translate().t("reactApp.deployments.deleteDisabled")
									: translate().t("reactApp.deployments.delete")
							}
							onClick={(event) => showDeleteDeploymentPopper(event, deployment)}
						></div>
					</div>
					{createPortal(
						<div>
							<Overlay
								isVisibile={index === 0 && (modalName === "deploymentDelete" || modalName === "deploymentExecute")}
								onOverlayClick={() => hidePopper()}
							/>
							<Popper visible={modalName === "deploymentDelete"} referenceRef={deletePopperElementRef}>
								<DeletePopper
									onConfirm={() => deleteDeploymentConfirmed()}
									onDismiss={() => deleteDeploymentDismissed()}
									translations={deleteDeploymentPopperTranslations}
								/>
							</Popper>
							<Popper
								visible={modalName === "deploymentExecute"}
								referenceRef={executePopperElementRef}
								className="w-1/2"
							>
								<ManualRunPopper
									files={files}
									selectedFile={selectedFile}
									onFileChange={setSelectedFile}
									functionName={selectedFunction}
									onFunctionChange={handleFunctionChange}
									onStartSession={startSession}
									onClose={() => hidePopper()}
									displayedErrors={displayedErrors}
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
