import { useCallback, useEffect, useRef, useState } from "react";
import { MessageType, SessionStateType } from "@enums";
import { DeploymentState } from "@enums";
import { translate } from "@i18n";
import { DeploymentSectionViewModel } from "@models";
import { Editor } from "@monaco-editor/react";
import { AKButton, AKDeploymentState, AKModal } from "@react-components";
import {
	AKTable,
	AKTableMessage,
	AKTableCell,
	AKTableHeader,
	AKTableRow,
	AKTableHeaderCell,
} from "@react-components/AKTable";
import { IIncomingDeploymentsMessagesHandler } from "@react-interfaces";
import { HandleDeploymentsIncomingMessages, getTimePassed, sendMessage } from "@react-utilities";
import { cn } from "@react-utilities/cnClasses.utils";
import { Message } from "@type";
import { Deployment, EntrypointTrigger, SessionEntrypoint } from "@type/models";
import { VSCodeDropdown } from "@vscode/webview-ui-toolkit/react";
import { usePopper } from "react-popper";

export const AKDeployments = ({ setActiveDeployment }: { setActiveDeployment: (deploymentId: string) => void }) => {
	const [isLoading, setIsLoading] = useState(true);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [rerender, setRerender] = useState(0);

	const [selectedDeployment, setSelectedDeployment] = useState("");
	const [deploymentsSection, setDeploymentsSection] = useState<DeploymentSectionViewModel | undefined>();
	const [totalDeployments, setTotalDeployments] = useState<number | undefined>();
	const [deployments, setDeployments] = useState<Deployment[] | undefined>();
	const [selectedDeploymentId, setSelectedDeploymentId] = useState<string | undefined>();

	const [modal, setModal] = useState(false);
	const [files, setFiles] = useState<Record<string, SessionEntrypoint>>();
	const [selectedFile, setSelectedFile] = useState<string>("");
	const [functions, setFunctions] = useState<string[]>();
	const [selectedFunction, setSelectedFunction] = useState<string>("");
	const [selectedEntrypoint, setSelectedEntrypoint] = useState<SessionEntrypoint>();
	const [entrypoints, setEntrypoints] = useState<EntrypointTrigger | undefined>();

	const [displayedErrors, setDisplayedErrors] = useState<Record<string, boolean>>({});
	const [displayExecutePopper, setDisplayExecutePopper] = useState<boolean>(false);

	const referenceEl = useRef<HTMLDivElement | null>(null);
	const popperEl = useRef<HTMLDivElement | null>(null);
	const isDeploymentStateStartable = (deploymentState: number) =>
		deploymentState === DeploymentState.INACTIVE_DEPLOYMENT || deploymentState === DeploymentState.DRAINING_DEPLOYMENT;
	const getSessionsByDeploymentId = (deploymentId: string) => {
		sendMessage(MessageType.selectDeployment, deploymentId);
		setSelectedDeployment(deploymentId);
	};
	const messageHandlers: IIncomingDeploymentsMessagesHandler = {
		setEntrypoints,
		setDeploymentsSection,
		setSelectedDeploymentId,
	};
	const handleMessagesFromExtension = useCallback(
		(event: MessageEvent<Message>) => HandleDeploymentsIncomingMessages(event, messageHandlers),
		[]
	);
	const getSessionStateCount = (deployment: Deployment, state: string) => {
		if (!deployment.sessionStats) {
			return translate().t("reactApp.general.unknown");
		}
		const session = deployment.sessionStats.find((s) => s.state === state);
		return session ? session.count : 0;
	};
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
		"border border-gray-300 p-4 rounded-lg shadow-lg"
	);

	const deactivateBuild = (deploymentId: string) => {
		sendMessage(MessageType.deactivateDeployment, deploymentId);
	};

	const activateBuild = (deploymentId: string) => {
		sendMessage(MessageType.activateDeployment, deploymentId);
		setActiveDeployment(deploymentId);
	};

	const togglePopper = () => {
		setDisplayExecutePopper(true);
	};

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setModal(false);
			}
		};
		window.addEventListener("keydown", handleKeyDown);

		const interval = setInterval(() => {
			setRerender((rerender) => rerender + 1);
		}, 1000);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			clearInterval(interval);
		};
	}, []);

	useEffect(() => {
		if (deployments && isLoading) {
			setIsLoading(false);
			const activeDeploymentId = deployments!.find((d) => !isDeploymentStateStartable(d.state))?.deploymentId as string;
			setActiveDeployment(activeDeploymentId);
		}
	}, [deployments]);

	useEffect(() => {
		if (deploymentsSection) {
			setTotalDeployments(deploymentsSection.totalDeployments);
			setDeployments(deploymentsSection?.deployments);
		}
	}, [deploymentsSection]);

	useEffect(() => {
		if (typeof selectedDeploymentId === "string") {
			setSelectedDeployment(selectedDeploymentId);
		}
	}, [selectedDeploymentId]);

	useEffect(() => {
		window.addEventListener("message", handleMessagesFromExtension);
		return () => {
			window.removeEventListener("message", handleMessagesFromExtension);
		};
	}, [handleMessagesFromExtension]);

	useEffect(() => {
		if (entrypoints && Object.keys(entrypoints).length > 0) {
			const filesWithFunctions = Object.keys(entrypoints).reduce((acc, currentKey) => {
				acc[currentKey] = entrypoints[currentKey];
				return acc;
			}, {});

			console.log("filesWithFunctions", filesWithFunctions);

			setFiles(filesWithFunctions);

			const firstFileName = Object.keys(filesWithFunctions)[0];
			setSelectedFile(firstFileName);
			const fileFunctions = filesWithFunctions[firstFileName];

			setFunctions(fileFunctions);
			setSelectedFunction(JSON.stringify(fileFunctions[0]));

			setSelectedEntrypoint({
				name: fileFunctions[0].name,
				...fileFunctions[0].location,
			});
		}
	}, [entrypoints]);

	useEffect(() => {
		if (files) {
			const firstFileName = Object.keys(files)[0];
			const fileFunctions = files[firstFileName];

			setFunctions(fileFunctions);

			setSelectedEntrypoint({
				name: fileFunctions[0].name,
				...fileFunctions[0].location,
			});
		}
	}, [selectedFile]);

	const runSessionExecution = () => {
		const activeDeployment = deployments?.find((d) => !isDeploymentStateStartable(d.state));

		setDisplayedErrors({});

		if (!activeDeployment?.deploymentId || !selectedFile || !selectedFunction) {
			if (!activeDeployment?.deploymentId) {
				setDisplayedErrors({ ...displayedErrors, selectedDeployment: true });
			}
			if (!selectedFile) {
				setDisplayedErrors({ ...displayedErrors, selectedFile: true });
			}
			if (!selectedFunction) {
				setDisplayedErrors({ ...displayedErrors, selectedFunction: true });
			}
			return;
		}
		const sessionExecutionData = {
			deploymentId: activeDeployment.deploymentId,
			sessionInputs: {},
			entrypoint: selectedEntrypoint,
		};

		sendMessage(MessageType.runSessionExecution, sessionExecutionData);

		setDisplayExecutePopper(false);
	};

	const handleFunctionChange = (event: string) => {
		const triggerFunction = JSON.parse(event);
		setSelectedEntrypoint({
			name: triggerFunction.symbol,
			...triggerFunction.location,
		});
		setSelectedFunction(event);
	};

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
									<div>
										<div
											className="codicon codicon-redo mr-2 cursor-pointer"
											ref={referenceEl}
											title="Execute"
											onClick={() => togglePopper()}
										></div>
										<div
											className="codicon codicon-debug-stop cursor-pointer text-red-500"
											onClick={() => deactivateBuild(deployment.deploymentId)}
										></div>
									</div>
								)}

								<div
									ref={popperEl}
									style={styles.popper}
									{...attributes.popper}
									className={cn(popperClasses, [{ invisible: !displayExecutePopper }])}
								>
									<div className="mb-3 text-left">
										<strong className="mb-2">{translate().t("reactApp.deployments.executeFile")}</strong>
										<VSCodeDropdown
											value={selectedFile}
											onChange={(e: any) => setSelectedFile(e.target.value)}
											className="flex"
										>
											{files &&
												Object.keys(files).map((file) => (
													<option key={file} value={file}>
														{file}
													</option>
												))}
										</VSCodeDropdown>
										{displayedErrors["triggerFile"] && <div className="text-red-500">Please choose trigger file</div>}
									</div>
									<div className="mb-3 text-left">
										<strong className="mb-2">{translate().t("reactApp.deployments.executeEntrypoint")}</strong>
										<VSCodeDropdown
											value={selectedFunction}
											onChange={(e: any) => handleFunctionChange(e.target.value)}
											disabled={functions !== undefined && functions.length <= 1}
											className="flex"
										>
											{functions &&
												functions.map((func) => (
													<option key={func.symbol} value={JSON.stringify(func)}>
														{func.symbol}
													</option>
												))}
										</VSCodeDropdown>
										{displayedErrors["triggerFunction"] && (
											<div className="text-red-500">Please choose trigger function</div>
										)}
									</div>
									<div className="flex">
										<AKButton
											classes="bg-vscode-editor-background text-vscode-foreground"
											onClick={() => setDisplayExecutePopper(false)}
										>
											{translate().t("reactApp.deployments.dismiss")}
										</AKButton>
										<div className="flex-grow" />
										<AKButton onClick={() => runSessionExecution()}>
											{translate().t("reactApp.deployments.saveAndRun")}
										</AKButton>
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

			{modal && (
				<AKModal>
					<div className="flex justify-end cursor-pointer" onClick={() => setModal(false)}>
						X
					</div>
					<div className="m-auto">
						<div className="flex w-full justify-end mt-2">
							<Editor
								height="90vh"
								defaultLanguage="json"
								defaultValue={sessionInputsForExecution ? JSON.stringify(sessionInputsForExecution, null, 2) : ""}
								theme="vs-dark"
								options={{ readOnly: true }}
							/>
						</div>
						<div className="flex w-full justify-end mt-2">
							<AKButton classes="ml-2" onClick={() => setModal(false)}>
								{translate().t("reactApp.deployments.closeModalButton")}
							</AKButton>
						</div>
					</div>
				</AKModal>
			)}
		</div>
	);
};

export default AKDeployments;
