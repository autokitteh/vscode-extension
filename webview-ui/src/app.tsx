import { useCallback, useEffect, useState } from "react";
import { MessageType, Theme } from "@enums/index";
import { translate } from "@i18n/index";
import { AKButton, AKLogo } from "@react-components";
import { IIncomingMessagesHandler } from "@react-interfaces/incomingMessagesHandler.interface";
import { AKDeployments, AKSessions } from "@react-sections";
import { HandleIncomingMessages, vscodeWrapper } from "@react-utilities";
import { Message } from "@type/index";
import { Deployment } from "@type/models/index";
import { Session } from "@type/models/index";
import "./App.css";

function App() {
	const [deployments, setDeployments] = useState<Deployment[] | undefined>();
	const [projectName, setProjectName] = useState<string | undefined>();
	const [themeVisualType, setThemeVisualType] = useState<Theme | undefined>();
	const [sessions, setSessions] = useState<Session[] | undefined>();

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
							{projectName || translate().t("reactApp.projects.noTitle")}
						</div>
						<AKButton classes="mx-4" onClick={() => sendMessage(MessageType.buildProject)}>
							<div className="codicon codicon-tools mr-2"></div>
							{translate().t("reactApp.general.build")}
						</AKButton>
						<AKButton onClick={() => sendMessage(MessageType.runProject)}>
							<div className="codicon codicon-play mr-2"></div>
							{translate().t("reactApp.general.run")}
						</AKButton>
					</div>
				</div>
				<AKDeployments deployments={deployments} />
				<AKSessions sessions={sessions} />
			</div>
		</main>
	);
}

export default App;
