import { useCallback, useEffect, useState } from "react";
import { AKButton, AKLogo } from "@components";
import { Deployment } from "@parent-ak-proto-ts/deployments/v1/deployment_pb";
import { Project } from "@parent-ak-proto-ts/projects/v1/project_pb";
import { Theme } from "@parent-enums/index";
import { Message, MessageType } from "@parent-type/index";
import { AKDeployments } from "@sections";
import { HandleIncomingMessages, vscodeWrapper } from "@utilities";
import "./App.css";

function App() {
	const [deployments, setDeployments] = useState<Deployment[] | undefined>();
	const [project, setProject] = useState<Project | undefined>();
	const [directory, setDirectory] = useState<string>("");
	const [themeVisualType, setThemeVisualType] = useState<Theme | undefined>();

	const delegate = {
		setDeployments,
		setProject,
		setDirectory,
		setThemeVisualType,
	};

	const handleMessagesFromExtension = useCallback(
		(event: MessageEvent<Message>) => HandleIncomingMessages(event, delegate),
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
							{project?.name || ""}
						</div>
						<AKButton classes="mx-4" onClick={() => sendMessage(MessageType.buildProject)}>
							<div className="codicon codicon-tools mr-2"></div>
							Build
						</AKButton>
						<AKButton onClick={() => sendMessage(MessageType.deployProject)}>
							<div className="codicon codicon-play mr-2"></div>
							Deploy
						</AKButton>
					</div>
				</div>
				<AKDeployments deployments={deployments} />
			</div>
		</main>
	);
}

export default App;
