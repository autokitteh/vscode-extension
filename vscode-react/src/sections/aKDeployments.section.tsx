import { useCallback, useEffect, useRef, useState } from "react";
import { MessageType, SessionStateType } from "@enums";
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
import { IIncomingDeploymentsMessagesHandler } from "@react-interfaces";
import { HandleDeploymentsIncomingMessages, getTimePassed, sendMessage } from "@react-utilities";
import { cn } from "@react-utilities/cnClasses.utils";
import { Message } from "@type";
import { Deployment } from "@type/models";
import { VSCodeDropdown } from "@vscode/webview-ui-toolkit/react";
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

	const referenceEl = useRef<HTMLDivElement | null>(null);
	const popperEl = useRef<HTMLDivElement | null>(null);

	const [files, setFiles] = useState<Record<string, string[]>>();
	const [selectedFile, setSelectedFile] = useState<string>("");
	const [functions, setFunctions] = useState<string[]>();
	const [selectedFunction, setSelectedFunction] = useState<string>("");
	const [entrypoints, setEntrypoints] = useState<Record<string, string[]> | undefined>();
	const [executionInputs, setExecutionInputs] = useState<Record<string, string[]>>();

	const messageHandlers: IIncomingDeploymentsMessagesHandler = {
		setEntrypoints,
		setExecutionInputs,
	};

	const handleMessagesFromExtension = useCallback(
		(event: MessageEvent<Message>) => HandleDeploymentsIncomingMessages(event, messageHandlers),
		[]
	);

	useEffect(() => {
		window.addEventListener("message", handleMessagesFromExtension);
		return () => {
			window.removeEventListener("message", handleMessagesFromExtension);
		};
	}, [handleMessagesFromExtension]);

	useEffect(() => {
		if (entrypoints) {
			setFiles(entrypoints);
			setSelectedFile(Object.keys(entrypoints)[0]);
			setFunctions(entrypoints[Object.keys(entrypoints)[0]]);
		}
	}, [entrypoints]);

	useEffect(() => {
		if (files) {
			const functionsForSelectedFile = files[selectedFile];
			setFunctions(functionsForSelectedFile || []);
			setSelectedFunction(functionsForSelectedFile?.[0] || "");
		}
	}, [selectedFile]);

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
	const [showPopper, setShowPopper] = useState(false);
	const togglePopper = () => setShowPopper(!showPopper);

	const saveExecutionProps = () => {
		// const executionProps = {
		// 	triggerFile: selectedFile,
		// 	triggerFunction: selectedFunction,
		// };
		// setExecuteProps(executionProps);
		togglePopper();
	};

	const popperClasses = cn(
		"flex-col z-30 bg-vscode-editor-background text-vscode-foreground",
		"border border-gray-300 p-4 rounded-lg shadow-lg",
		{ invisible: !showPopper }
	);

	return (
		<div className="mt-4 h-[43vh] overflow-y-auto overflow-x-hidden">
			<div className="flex items-baseline">
				<h1 className="flex text-lg font-extralight mb-2">{translate().t("reactApp.deployments.tableTitle")}</h1>
				<div className="ml-1 text-lg font-extralight">({totalDeployments})</div>
			</div>
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

								<div ref={popperEl} style={styles.popper} {...attributes.popper} className={popperClasses}>
									<div className="mb-3 text-left">
										<strong className="mb-2">File</strong>
										<VSCodeDropdown
											value={selectedFile}
											onChange={(e: any) => setSelectedFile(e.target.value)}
											disabled={files !== undefined && Object.keys(files).length <= 1}
											className="flex"
										>
											{files &&
												Object.keys(files).map((file) => (
													<option key={file} value={file}>
														{file}
													</option>
												))}
										</VSCodeDropdown>
									</div>
									<div className="mb-3 text-left">
										<strong className="mb-2">Entrypoint</strong>
										<VSCodeDropdown
											value={selectedFunction}
											onChange={(e: any) => setSelectedFunction(e.target.value)}
											disabled={functions !== undefined && functions.length <= 1}
											className="flex"
										>
											{functions &&
												functions.map((func) => (
													<option key={func} value={func}>
														{func}
													</option>
												))}
										</VSCodeDropdown>
									</div>
									<div className="mb-3 text-left">
										<strong className="mb-2">Session parameters</strong>
										{executionInputs ? (
											JSON.stringify(executionInputs).length > 5 ? (
												<div
													// onClick={() => setModal(true)}
													className="flex cursor-pointer bg-vscode-dropdown-background"
												>
													{JSON.stringify(executionInputs).substring(0, 6) + "\u2026"}
												</div>
											) : (
												<div
													// onClick={() => setModal(true)}
													className="flex cursor-pointer bg-vscode-dropdown-background"
												>
													{JSON.stringify(executionInputs)}
												</div>
											)
										) : (
											<div>Set session execution params</div>
										)}
									</div>
									<div className="flex">
										<AKButton
											classes="bg-vscode-editor-background text-vscode-foreground"
											onClick={() => togglePopper()}
										>
											Dismiss
										</AKButton>
										<div className="flex-grow" />
										<AKButton onClick={() => saveExecutionProps()}>Save</AKButton>
									</div>
								</div>
								{!isDeploymentStateStartable(deployment.state) && (
									<AKButton classes="w-10 mr-2" onClick={togglePopper}>
										<div className="codicon codicon-debug-continue mr-2" ref={referenceEl}></div>
									</AKButton>
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
