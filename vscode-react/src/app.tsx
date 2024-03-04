import { useCallback, useEffect, useState } from "react";
import { MessageType, Theme } from "@enums";
import { translate } from "@i18n";
import { Player } from "@lottiefiles/react-lottie-player";
import loaderAnimation from "@react-assets/media/catto-loader.json";
import { AKButton, AKLogo } from "@react-components";
import { IIncomingMessagesHandler } from "@react-interfaces";
import { AKDeployments, AKSessions } from "@react-sections";
import { HandleIncomingMessages, sendMessage } from "@react-utilities";
import { cn } from "@react-utilities/cnClasses.utils";
import { Message } from "@type";
import "./app.css";

function App() {
	const [projectName, setProjectName] = useState<string | undefined>();
	const [themeVisualType, setThemeVisualType] = useState<Theme | undefined>();
	const [resourcesDirState, setResourcesDirState] = useState<boolean>(false);

	const messageHandlers: IIncomingMessagesHandler = {
		setProjectName,
		setThemeVisualType,
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
						{/* <AKButton onClick={runExecution} classes="mr-4" disabled={!isReadyToExecute()}>
							<div className="codicon codicon-send mr-2"></div>
							{translate().t("reactApp.general.execute")}
						</AKButton> */}
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
					{/* {modal && (
						<AKModal>
							<div className="flex justify-end cursor-pointer" onClick={() => setModal(false)}>
								X
							</div>
							<div className="m-auto">
								<div className="flex w-full justify-end mt-2">
									<Editor
										height="90vh"
										defaultLanguage="json"
										defaultValue={executionInputs ? JSON.stringify(executionInputs, null, 2) : ""}
										theme="vs-dark"
										options={{ readOnly: true }}
									/>
								</div>
								<div className="flex w-full justify-end mt-2">
									<AKButton classes="ml-2" onClick={() => setModal(false)}>
										Close
									</AKButton>
								</div>
							</div>
						</AKModal>
					)} */}

					<AKDeployments />
					<AKSessions />
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
