import { useCallback, useEffect, useRef, useState } from "react";
import { MessageType, Theme } from "@enums";
import { translate } from "@i18n";
import { Player } from "@lottiefiles/react-lottie-player";
import { DeploymentSectionViewModel } from "@models";
import { SessionSectionViewModel } from "@models/views";
import loaderAnimation from "@react-assets/media/catto-loader.json";
import { AKButton, AKLogo, AKModal } from "@react-components";
import { IIncomingMessagesHandler } from "@react-interfaces";
import { AKDeployments, AKSessions } from "@react-sections";
import { HandleIncomingMessages, sendMessage } from "@react-utilities";
import { cn } from "@react-utilities/cnClasses.utils";
import { ExecutionParams, Message } from "@type";
import "./app.css";
import { VSCodeDropdown } from "@vscode/webview-ui-toolkit/react";
import MonacoEditor from "react-monaco-editor";
import { usePopper } from "react-popper";

function App() {
	const [deploymentsSection, setDeploymentsSection] = useState<DeploymentSectionViewModel | undefined>();
	const [projectName, setProjectName] = useState<string | undefined>();
	const [themeVisualType, setThemeVisualType] = useState<Theme | undefined>();
	const [selectedDeploymentId, setSelectedDeploymentId] = useState<string | undefined>();
	const [resourcesDirState, setResourcesDirState] = useState<boolean>(false);
	const [entrypoints, setEntrypoints] = useState<Record<string, string[]> | undefined>();
	const [sessionsSection, setSessionsSection] = useState<SessionSectionViewModel | undefined>();
	const [modal, setModal] = useState(false);
	const [executeProps, setExecuteProps] = useState<ExecutionParams>({});
	const [executionInputsDefined, setExecutionInputsDefined] = useState(false);

	const messageHandlers: IIncomingMessagesHandler = {
		setDeploymentsSection,
		setProjectName,
		setThemeVisualType,
		setSessionsSection,
		setSelectedDeploymentId,
		setResourcesDirState,
		setEntrypoints,
		setExecutionInputsDefined,
	};

	const handleMessagesFromExtension = useCallback(
		(event: MessageEvent<Message>) => HandleIncomingMessages(event, messageHandlers),
		[]
	);

	useEffect(() => {
		window.addEventListener("message", handleMessagesFromExtension);
		return () => {
			window.removeEventListener("message", handleMessagesFromExtension);
		};
	}, [handleMessagesFromExtension]);

	const [files, setFiles] = useState<Record<string, string[]>>();
	const [selectedFile, setSelectedFile] = useState<string>("");
	const [functions, setFunctions] = useState<string[]>();
	const [selectedFunction, setSelectedFunction] = useState<string>("");

	useEffect(() => {
		if (files) {
			const functionsForSelectedFile = files[selectedFile];

			setFunctions(functionsForSelectedFile || []);
			setSelectedFunction(functionsForSelectedFile?.[0] || "");
		}
	}, [selectedFile]);

	useEffect(() => {
		if (entrypoints) {
			setFiles(entrypoints);
			setSelectedFile(Object.keys(entrypoints)[0]);
			setFunctions(entrypoints[Object.keys(entrypoints)[0]]);
		}
	}, [entrypoints]);

	const referenceEl = useRef<HTMLDivElement | null>(null);
	const popperEl = useRef<HTMLDivElement | null>(null);

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

	const isReadyToExecute = () => {
		return !!(
			selectedDeploymentId &&
			executeProps.triggerFile &&
			executeProps.triggerFunction &&
			executionInputsDefined
		);
	};

	const submitExecutionInputs = () => {
		const executionProps = {
			triggerFile: selectedFile,
			triggerFunction: selectedFunction,
		};
		setExecuteProps(executionProps);
		togglePopper();
	};
	const runExecution = () => {
		sendMessage(MessageType.runExecution, executeProps);
	};

	const popperClasses = cn(
		"flex-col z-30 bg-vscode-editor-background text-vscode-foreground",
		"border border-gray-300 p-4 rounded-lg shadow-lg",
		{ invisible: !showPopper }
	);

	return (
		<main>
			{showPopper && <div className="absolute w-full h-full z-20" onClick={() => togglePopper()}></div>}
			{!!projectName ? (
				<div className="flex flex-col w-full">
					<div className="flex items-center w-full">
						<AKLogo className="w-12 h-12" themeVisualType={themeVisualType} />
						<div className="text-vscode-input-foreground font-bold ml-4 text-lg">{projectName}</div>
						<AKButton
							classes="mx-4"
							onClick={() => sendMessage(MessageType.buildProject)}
							disabled={!resourcesDirState}
						>
							<div className="codicon codicon-tools mr-2"></div>
							{translate().t("reactApp.general.build")}
						</AKButton>
						<AKButton onClick={() => sendMessage(MessageType.runProject)} disabled={!resourcesDirState}>
							<div className="codicon codicon-rocket mr-2"></div>
							{translate().t("reactApp.general.deploy")}
						</AKButton>

						<div className="mx-4">|</div>

						<div ref={popperEl} style={styles.popper} {...attributes.popper} className={popperClasses}>
							<div className="mb-3">
								<strong>File:</strong>
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
							<div className="mb-3">
								<strong>Entrypoint:</strong>
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
							<div className="mb-3">
								<strong>Session parameters:</strong>
								<div onClick={() => setModal(true)} className="flex cursor-pointer bg-vscode-dropdown-background">
									{"{param1: 'test', param2: 'test'..."}
								</div>
							</div>
							<div className="flex">
								<AKButton classes="bg-vscode-editor-background text-vscode-foreground" onClick={() => togglePopper()}>
									Dismiss
								</AKButton>
								<div className="flex-grow" />
								<AKButton onClick={() => submitExecutionInputs()}>Save</AKButton>
							</div>
						</div>
						<AKButton
							classes="w-10 mr-2"
							onClick={togglePopper}
							disabled={!resourcesDirState || !deploymentsSection || !deploymentsSection.totalDeployments}
						>
							<div className="codicon codicon-edit mr-2" ref={referenceEl}></div>
						</AKButton>
						<AKButton onClick={runExecution} classes="mr-4" disabled={!isReadyToExecute()}>
							<div className="codicon codicon-send mr-2"></div>
							{translate().t("reactApp.general.execute")}
						</AKButton>
						<div className="flex-grow"></div>
						{!resourcesDirState && (
							<div className="mr-2">
								<strong>{translate().t("reactApp.settings.setLocalDirectory")} </strong>
							</div>
						)}
						<AKButton
							onClick={() => sendMessage(MessageType.onClickSetResourcesDirectory)}
							classes={cn(resourcesDirState ? "bg-gray-700" : "bg-red-700")}
							title={translate().t("reactApp.settings.pickDirectoryOfExecutables")}
						>
							<div className="codicon codicon-folder-opened w-4"></div>
						</AKButton>
					</div>
					{modal && (
						<AKModal>
							<div className="text-black text-xl">Session parameters</div>
							<div className="m-auto">
								<div className="flex w-fulljustify-end mt-2">
									<MonacoEditor
										language="json"
										height="50vh"
										width="100vw"
										theme="vs-dark"
										// value={executeProps}
										// onChange={(value) => setExecuteParams(value)}
										className="z-50"
									/>
								</div>
								<div className="flex w-full justify-end mt-2">
									<AKButton classes="bg-gray-500" onClick={() => setModal(false)}>
										Dismiss
									</AKButton>
									<AKButton classes="ml-2" onClick={() => setModal(false)}>
										Update
									</AKButton>
								</div>
							</div>
						</AKModal>
					)}

					<AKDeployments
						deployments={deploymentsSection?.deployments}
						totalDeployments={deploymentsSection?.totalDeployments}
						selectedDeploymentId={selectedDeploymentId}
					/>
					<AKSessions sessions={sessionsSection?.sessions} totalSessions={sessionsSection?.totalSessions} />
				</div>
			) : (
				<div className="flex justify-center items-center h-screen w-screen">
					<Player src={loaderAnimation} className="player" loop autoplay />
				</div>
			)}
		</main>
	);
}

export default App;
