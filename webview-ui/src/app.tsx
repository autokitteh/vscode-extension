import { useCallback, useEffect, useState } from "react";
import { Deployment } from "@ak-proto-ts/deployments/v1/deployment_pb";
import { Session } from "@ak-proto-ts/sessions/v1/session_pb";
import { AKButton, AKLogo } from "@components";
import { Theme } from "@enums/index";
import { translate } from "@i18n/index";
import { IIncomingMessagesHandler } from "@interfaces/incomingMessagesHandler.interface";
import { AKDeployments } from "@sections";
import { Message, MessageType } from "@type/index";
import { HandleIncomingMessages, vscodeWrapper } from "@utilities";
import "./App.css";

function App() {
	const [deployments, setDeployments] = useState<Deployment[] | undefined>();
	const [sessions, setSessions] = useState<Session[] | undefined>();
	const [projectName, setProjectName] = useState<string | undefined>();
	const [themeVisualType, setThemeVisualType] = useState<Theme | undefined>();

	const messageHandlers: IIncomingMessagesHandler = {
		setDeployments,
		setProjectName,
		setThemeVisualType,
		setSessions,
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

	const sendMessage = (type: MessageType) => {
		vscodeWrapper.postMessage({ type } as Message);
	};

	return (
		<main>
			<div className="flex flex-col w-full">
				<div className="flex mr-8">
					<div className="flex items-center">
						<AKLogo className="w-12 h-12" themeVisualType={themeVisualType} />
						<div className="text-vscode-input-foreground font-bold ml-4 text-lg">
							{projectName || translate().t("reactAppErrors.projects.noTitle")}
						</div>
						<AKButton classes="mx-4" onClick={() => sendMessage(MessageType.buildProject)}>
							<div className="codicon codicon-tools mr-2"></div>
							{translate().t("reactAppGeneral.test")}
						</AKButton>
						<AKButton onClick={() => sendMessage(MessageType.deployProject)}>
							<div className="codicon codicon-play mr-2"></div>
							{translate().t("reactAppGeneral.run")}
						</AKButton>
					</div>
				</div>
				<AKDeployments deployments={deployments} />
			</div>
		</main>
	);
}

export default App;
