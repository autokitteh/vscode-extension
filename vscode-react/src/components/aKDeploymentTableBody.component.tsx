import React, { useCallback, useEffect, useRef, useState } from "react";
import { DeploymentState, MessageType, SessionStateType } from "@enums";
import { translate } from "@i18n";
import { AKDeploymentState } from "@react-components";
import { DeletePopper } from "@react-components/aKDeploymentsDeletePopper.component";
import { ExecutePopperComponent } from "@react-components/aKDeploymentsExecutePopper.component";
import { PopperComponent } from "@react-components/aKPopper.component";
import { AKTableCell, AKTableRow } from "@react-components/AKTable";
import { useDeployments, usePoppersManager } from "@react-hooks";
import { IIncomingDeploymentsMessagesHandler } from "@react-interfaces";
import { getTimePassed, HandleIncomingDeploymentsMessages, sendMessage } from "@react-utilities";
import { Message } from "@type";
import { Deployment, SessionEntrypoint } from "@type/models";

export const AKDeploymentTableBody = ({ deployments }: { deployments?: Deployment[] }) => {
	const { selectedDeploymentId, entrypoints } = useDeployments();
	const { visiblePoppers, togglePopperVisibility, hidePopper, setPopperVisibility, hideAllPoppers } =
		usePoppersManager();

	useEffect(() => {
		if (typeof selectedDeploymentId === "string") {
			setSelectedDeployment(selectedDeploymentId);
		}
	}, [selectedDeploymentId]);

	useEffect(() => {
		setPopperVisibility("execute", false);
	}, []);

	const executePopperElementRef = useRef<HTMLDivElement | null>(null);
	const deletePopperElementRef = useRef<HTMLDivElement | null>(null);

	const isDeploymentStateStartable = (deploymentState: number) =>
		deploymentState === DeploymentState.INACTIVE_DEPLOYMENT || deploymentState === DeploymentState.DRAINING_DEPLOYMENT;
	const [selectedFile, setSelectedFile] = useState<string>("");
	const [selectedFunction, setSelectedFunction] = useState<string>("");
	const [selectedEntrypoint, setSelectedEntrypoint] = useState<SessionEntrypoint>();

	const [selectedDeployment, setSelectedDeployment] = useState("");
	const [files, setFiles] = useState<Record<string, SessionEntrypoint[]>>();
	const [functions, setFunctions] = useState<SessionEntrypoint[]>();
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

	const [displayedErrors, setDisplayedErrors] = useState<Record<string, boolean>>({});

	useEffect(() => {
		if (entrypoints && Object.keys(entrypoints).length) {
			setFiles(entrypoints);
			setSelectedFile(Object.keys(entrypoints)[0]);
			setFunctions(entrypoints[Object.keys(entrypoints)[0]]);
			setSelectedFunction(JSON.stringify(entrypoints[Object.keys(entrypoints)[0]][0]));
			setSelectedEntrypoint(entrypoints[Object.keys(entrypoints)[0]][0]);
		}
	}, [entrypoints]);

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

		hidePopper("execute");
	};

	const [isDeletingInProccess, setIsDeletingInProgress] = useState(false);
	const [deleteDeploymentId, setDeleteDeploymentId] = useState<string | null>(null);
	const [deletedDeploymentError, setDeletedDeploymentError] = useState(false);

	const handleDeploymentDeletedResponse = (isDeleted: boolean) => {
		setIsDeletingInProgress(false);
		if (isDeleted) {
			hidePopper("delete");
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

	useEffect(() => {
		window.addEventListener("message", handleMessagesFromExtension);
		return () => {
			window.removeEventListener("message", handleMessagesFromExtension);
		};
	}, [handleMessagesFromExtension]);

	useEffect(() => {
		if (typeof selectedDeploymentId === "string") {
			setSelectedDeployment(selectedDeploymentId);
		}
	}, [selectedDeploymentId]);

	const deleteDeploymentAction = (isApproved: boolean) => {
		if (isApproved) {
			sendMessage(MessageType.deleteDeployment, deleteDeploymentId);
			setIsDeletingInProgress(true);
			return;
		}
		setIsDeletingInProgress(false);
		setDeletedDeploymentError(false);
		setDeleteDeploymentId("");
		hidePopper("delete");
	};

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
					{deployment.deploymentId === deployments?.[0]?.deploymentId && (
						<div
							className="codicon codicon-redo mr-2 cursor-pointer"
							ref={executePopperElementRef}
							title="Execute"
							onClick={() => togglePopperVisibility("execute")}
						></div>
					)}
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
						className="relative codicon codicon-trash cursor-pointer ml-2 z-20"
						onClick={(e) => {
							const refElement = e.currentTarget;
							setPopperVisibility("delete", true);
							deletePopperElementRef.current = refElement;
							setDeleteDeploymentId(deployment.deploymentId);
						}}
					></div>

					{(visiblePoppers["delete"] || visiblePoppers["execute"]) && (
						<div className="absolute h-screen w-screen top-0 left-0 z-10" onClick={() => hideAllPoppers()}></div>
					)}

					<PopperComponent visible={visiblePoppers["delete"]} referenceRef={deletePopperElementRef}>
						<DeletePopper
							isVisible={visiblePoppers["delete"]}
							isDeletingInProcess={isDeletingInProccess}
							onDeleteConfirm={() => deleteDeploymentAction(true)}
							onDeleteCancel={() => deleteDeploymentAction(false)}
							hasDeleteError={deletedDeploymentError}
						/>
					</PopperComponent>
					<PopperComponent visible={visiblePoppers["execute"]} referenceRef={executePopperElementRef}>
						<ExecutePopperComponent
							files={files!}
							functions={functions!}
							selectedFile={selectedFile}
							selectedFunction={selectedFunction}
							onFileChange={setSelectedFile}
							onFunctionChange={handleFunctionChange}
							onStartSession={startSession}
							onClose={() => hidePopper("execute")}
							displayedErrors={displayedErrors}
						/>
					</PopperComponent>
				</AKTableCell>
			</AKTableRow>
		))
	);
};
