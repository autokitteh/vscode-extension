import React, { useEffect, useRef, useState } from "react";
import { DeploymentState, MessageType, SessionStateType } from "@enums";
import { translate } from "@i18n";
import { AKDeploymentState, AKOverlay } from "@react-components";
import { DeletePopper, ExecutePopper, PopperComponent } from "@react-components";
import { AKTableCell, AKTableRow } from "@react-components/AKTable";
import { useAppState } from "@react-context/appState.context";
import { useDeployments } from "@react-hooks";
import { useIncomingMessageHandler } from "@react-hooks";
import { getTimePassed, sendMessage } from "@react-utilities";
import { Deployment, SessionEntrypoint } from "@type/models";

export const AKDeploymentTableBody = ({ deployments }: { deployments?: Deployment[] }) => {
	// State Hooks Section
	const { selectedDeploymentId, entrypoints } = useDeployments();
	const [{ modalName }, dispatch] = useAppState();
	const executePopperElementRef = useRef<HTMLDivElement | null>(null);
	const deletePopperElementRef = useRef<HTMLDivElement | null>(null);
	const [selectedFile, setSelectedFile] = useState<string>("");
	const [selectedFunction, setSelectedFunction] = useState<string>("");
	const [selectedEntrypoint, setSelectedEntrypoint] = useState<SessionEntrypoint>();
	const [selectedDeployment, setSelectedDeployment] = useState("");
	const [files, setFiles] = useState<Record<string, SessionEntrypoint[]>>();
	const [functions, setFunctions] = useState<SessionEntrypoint[]>();
	const [isDeletingInProcess, setIsDeletingInProgress] = useState(false);
	const [deleteDeploymentId, setDeleteDeploymentId] = useState<string | null>(null);
	const [displayedErrors, setDisplayedErrors] = useState<Record<string, boolean>>({});

	// Local variable
	const deleteDeploymentPopperTranslations = {
		title: translate().t("reactApp.deployments.deletionApprovalQuestion"),
		subtitle: translate().t("reactApp.deployments.deletionApprovalQuestionSubtitle"),
	};

	// Incoming Messages Handler
	const handleDeploymentDeletedResponse = () => {
		setIsDeletingInProgress(false);
		hidePopper();
	};

	useIncomingMessageHandler({ handleDeploymentDeletedResponse });

	// Functions Section
	const showPopper = (popperId: string) => dispatch({ type: "SET_MODAL_NAME", payload: popperId });
	const hidePopper = () => dispatch({ type: "SET_MODAL_NAME", payload: "" });

	const isLatestDeployment = (deploymentId: string) => deploymentId === deployments?.[0].deploymentId;

	const displayOverlayForPoppers = (deploymentId: string) =>
		isLatestDeployment(deploymentId) && (modalName === "deploymentDelete" || modalName === "deploymentExecute");

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
		let entrypointForFunction;
		try {
			entrypointForFunction = JSON.parse(event);
		} catch (error) {
			console.error(error);
		}
		setSelectedEntrypoint(entrypointForFunction);
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
		setSelectedDeployment(deploymentId);
	};

	const isActive = (deploymentState: DeploymentState) => deploymentState === DeploymentState.ACTIVE_DEPLOYMENT;

	const startSession = () => {
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
			entrypoint: selectedEntrypoint,
		};

		sendMessage(MessageType.startSession, startSessionArgs);

		hidePopper();
	};

	const deleteDeploymentConfirmed = () => {
		sendMessage(MessageType.deleteDeployment, deleteDeploymentId);
		setIsDeletingInProgress(true);
	};

	const deleteDeploymentDismissed = () => {
		setIsDeletingInProgress(false);
		setDeleteDeploymentId("");
		hidePopper();
	};

	const showDeleteDeploymentPopper = (event: React.MouseEvent<HTMLDivElement>, deployment: Deployment) => {
		if (deployment.state === DeploymentState.ACTIVE_DEPLOYMENT) {
			sendMessage(MessageType.displayErrorWithoutActionButton, translate().t("reactApp.deployments.deleteDisabled"));
			return;
		}
		const refElement = event.currentTarget;
		showPopper("deploymentDelete");
		deletePopperElementRef.current = refElement;
		setDeleteDeploymentId(deployment.deploymentId);
	};

	// useEffects Section
	useEffect(() => {
		if (typeof selectedDeploymentId === "string") {
			setSelectedDeployment(selectedDeploymentId);
		}
	}, [selectedDeploymentId]);

	useEffect(() => {
		hidePopper();
	}, []);

	useEffect(() => {
		if (entrypoints && Object.keys(entrypoints).length) {
			setFiles(entrypoints);
			setSelectedFile(Object.keys(entrypoints)[0]);
			setFunctions(entrypoints[Object.keys(entrypoints)[0]]);
			setSelectedFunction(JSON.stringify(entrypoints[Object.keys(entrypoints)[0]][0]));
			setSelectedEntrypoint(entrypoints[Object.keys(entrypoints)[0]][0]);
		}
	}, [entrypoints]);

	useEffect(() => {
		if (typeof selectedDeploymentId === "string") {
			setSelectedDeployment(selectedDeploymentId);
		}
	}, [selectedDeploymentId]);

	return (
		deployments &&
		deployments.map((deployment: Deployment) => (
			<AKTableRow key={deployment.deploymentId} isSelected={selectedDeployment === deployment.deploymentId}>
				<AKTableCell onClick={() => getSessionsByDeploymentId(deployment.deploymentId)} classes={["cursor-pointer"]}>
					{getTimePassed(deployment.createdAt)}
				</AKTableCell>
				<AKTableCell onClick={() => getSessionsByDeploymentId(deployment.deploymentId)} classes={["cursor-pointer"]}>
					<div className="flex justify-center">
						<AKDeploymentState deploymentState={deployment.state} />
					</div>
				</AKTableCell>
				<AKTableCell onClick={() => getSessionsByDeploymentId(deployment.deploymentId)} classes={["cursor-pointer"]}>
					{getSessionStateCount(deployment, SessionStateType.stopped)}
				</AKTableCell>
				<AKTableCell onClick={() => getSessionsByDeploymentId(deployment.deploymentId)} classes={["cursor-pointer"]}>
					{getSessionStateCount(deployment, SessionStateType.running)}
				</AKTableCell>
				<AKTableCell onClick={() => getSessionsByDeploymentId(deployment.deploymentId)} classes={["cursor-pointer"]}>
					{getSessionStateCount(deployment, SessionStateType.error)}
				</AKTableCell>
				<AKTableCell onClick={() => getSessionsByDeploymentId(deployment.deploymentId)} classes={["cursor-pointer"]}>
					{getSessionStateCount(deployment, SessionStateType.completed)}
				</AKTableCell>
				<AKTableCell onClick={() => getSessionsByDeploymentId(deployment.deploymentId)} classes={["cursor-pointer"]}>
					{deployment.buildId}
				</AKTableCell>
				<AKTableCell>
					{isLatestDeployment(deployment.deploymentId) && (
						<div
							className="codicon codicon-redo mr-2 cursor-pointer"
							ref={executePopperElementRef}
							title={translate().t("reactApp.deployments.execute")}
							onClick={() => showPopper("deploymentExecute")}
						></div>
					)}
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
						} ml-2`}
						title={
							isActive(deployment.state)
								? translate().t("reactApp.deployments.deleteDisabled")
								: translate().t("reactApp.deployments.delete")
						}
						onClick={(event) => showDeleteDeploymentPopper(event, deployment)}
					></div>

					<AKOverlay
						isVisibile={displayOverlayForPoppers(deployment.deploymentId)}
						onOverlayClick={() => hidePopper()}
					/>
					<PopperComponent visible={modalName === "deploymentDelete"} referenceRef={deletePopperElementRef}>
						<DeletePopper
							isDeletingInProcess={isDeletingInProcess}
							onConfirm={() => deleteDeploymentConfirmed()}
							onDismiss={() => deleteDeploymentDismissed()}
							translations={deleteDeploymentPopperTranslations}
						/>
					</PopperComponent>
					<PopperComponent visible={modalName === "deploymentExecute"} referenceRef={executePopperElementRef}>
						<ExecutePopper
							files={files!}
							functions={functions!}
							selectedFile={selectedFile}
							selectedFunction={selectedFunction}
							onFileChange={setSelectedFile}
							onFunctionChange={handleFunctionChange}
							onStartSession={startSession}
							onClose={() => hidePopper()}
							displayedErrors={displayedErrors}
						/>
					</PopperComponent>
				</AKTableCell>
			</AKTableRow>
		))
	);
};
