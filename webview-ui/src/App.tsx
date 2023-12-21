import { useEffect, useState } from "react";
import AKLogoBlack from "@assets/images/ak-logo-black.svg?react";
import AKLogoWhite from "@assets/images/ak-logo-white.svg?react";
import { AKButton } from "@components";
import { IIncomingMessagesHandler } from "@interfaces";
import { Deployment } from "@parent-ak-proto-ts/deployments/v1/deployment_pb";
import { Project } from "@parent-ak-proto-ts/projects/v1/project_pb";
import { Theme } from "@parent-enums/index";
import { Message, MessageType } from "@parent-type/index";
import { AKDeployments } from "@sections";
import { vscodeWrapper } from "@utilities";
import { HandleIncomingMessages } from "@utilities";
import "./App.css";

function App() {
	const [messagesFromExtension, setMessagesFromExtension] = useState<any>([]);
	const [deployments, setDeployments] = useState<Deployment[] | undefined>();
	const [project, setProject] = useState<Project | undefined>();
	const [directory, setDirectory] = useState<string>("");
	const [themeVisualType, setThemeVisualType] = useState<Theme | undefined>();
	const delegate: IIncomingMessagesHandler = {
		setDeployments,
		setProject,
		setDirectory,
		setThemeVisualType,
	};

	/**
	 * Handles incoming messages from the extension.
	 * @param {MessageEvent<Message>} event - The message event.
	 */
	const handleMessagesFromExtension = (event: MessageEvent<Message>) => {
		HandleIncomingMessages(event, delegate);
	};

	useEffect(() => {
		/**
		 * Adds an event listener for incoming messages from the extension.
		 * @param {MessageEvent<Message>} event - The message event.
		 */
		const eventListener = (event: MessageEvent<Message>): void =>
			handleMessagesFromExtension(event);

		return () => {
			/**
			 * Removes the event listener for incoming messages from the extension.
			 */
			window.removeEventListener("message", eventListener);
		};
	}, [handleMessagesFromExtension]);

	/**
	 * Renders the appropriate logo based on the theme visual type.
	 * @param {string} className - The class name for the logo component.
	 * @returns {JSX.Element} The logo component.
	 */
	const Logo = ({ className }: { className: string }) =>
		themeVisualType === 2 || themeVisualType === 3 ? (
			<AKLogoWhite className={className} fill="white" />
		) : (
			<AKLogoBlack className={className} />
		);

	const deployProject = () => {
		vscodeWrapper.postMessage({
			type: MessageType.deployProject,
		} as Message);
	};

	const buildProject = () => {
		vscodeWrapper.postMessage({
			type: MessageType.buildProject,
		} as Message);
	};

	return (
		<main>
			<div className="flex flex-col w-full">
				<div className="flex mr-8">
					<div className="flex items-center">
						<Logo className="w-12 h-12" />
						<div className="text-vscode-input-foreground font-bold ml-4 text-lg">
							{project?.name || ""}
						</div>
						<AKButton classes="mx-4" onClick={buildProject}>
							<div className="codicon codicon-tools mr-2"></div>
							Build
						</AKButton>
						<AKButton onClick={deployProject}>
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
