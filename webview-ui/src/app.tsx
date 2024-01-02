import { useCallback, useEffect, useState } from "react";
import { MessageType, Theme } from "@enums";
import { translate } from "@i18n";
import { DeploymentSectionViewModel } from "@models";
import { AKButton, AKLogo } from "@react-components";
import { IIncomingMessagesHandler } from "@react-interfaces/incomingMessagesHandler.interface";
import { AKDeployments, AKSessions } from "@react-sections";
import { HandleIncomingMessages, sendMessage } from "@react-utilities";
import { Message } from "@type";
import { Session } from "@type/models";
import "./App.css";

function App() {
	const [deploymentsSection, setDeploymentsSection] = useState<
		DeploymentSectionViewModel | undefined
	>();
	const [projectName, setProjectName] = useState<string | undefined>();
	const [themeVisualType, setThemeVisualType] = useState<Theme | undefined>();
	const [sessions, setSessions] = useState<Session[] | undefined>();

	const messageHandlers: IIncomingMessagesHandler = {
		setDeploymentsSection,
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
							{translate().t("reactApp.general.deploy")}
						</AKButton>
					</div>
				</div>
				<AKDeployments {...deploymentsSection} />
				<AKSessions sessions={sessions} />
			</div>
		</main>
	);
}

export default App;
