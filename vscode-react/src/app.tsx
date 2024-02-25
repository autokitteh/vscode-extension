import { useCallback, useEffect, useState } from "react";
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
import { Message } from "@type";
import "./app.css";
import * as monaco from "monaco-editor";
import MonacoEditor from "react-monaco-editor";

function App() {
	const [deploymentsSection, setDeploymentsSection] = useState<DeploymentSectionViewModel | undefined>();
	const [projectName, setProjectName] = useState<string | undefined>();
	const [themeVisualType, setThemeVisualType] = useState<Theme | undefined>();
	const [selectedDeploymentId, setSelectedDeploymentId] = useState<string | undefined>();
	const [resourcesDirState, setResourcesDirState] = useState<boolean>(false);
	const [sessionsSection, setSessionsSection] = useState<SessionSectionViewModel | undefined>();
	const [code, setCode] = useState("// type your code...");
	const [modal, setModal] = useState(false);

	const messageHandlers: IIncomingMessagesHandler = {
		setDeploymentsSection,
		setProjectName,
		setThemeVisualType,
		setSessionsSection,
		setSelectedDeploymentId,
		setResourcesDirState,
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

	const editorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
		console.log("editorDidMount", editor);
		editor.focus();
	};
	const onChange = (newValue: string, e: monaco.editor.IModelContentChangedEvent) => {
		console.log("onChange", newValue, e);
		setCode(newValue);
	};

	return (
		<main>
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
						<AKButton onClick={() => setModal(true)} classes="w-10 mr-2">
							<div className="codicon codicon-edit mr-2"></div>
						</AKButton>
						<AKButton onClick={() => sendMessage(MessageType.runProject)} classes="mr-4">
							<div className="codicon codicon-send mr-2"></div>
							{translate().t("reactApp.general.singleShot")}
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
										value={code}
										onChange={onChange}
										editorDidMount={editorDidMount}
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
