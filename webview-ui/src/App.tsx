import { useCallback, useEffect, useState } from "react";
import { AKButton } from "./components";
import Deployments from "./sections/AKDeployments";
import { vscodeWrapper } from "./utilities/vscode";
import { Deployment } from "../../src/autokitteh/proto/gen/ts/autokitteh/deployments/v1/deployment_pb";
import { Project } from "../../src/autokitteh/proto/gen/ts/autokitteh/projects/v1/project_pb";
import { Theme } from "../../src/enums/index";
import { Message, MessageType } from "../../src/types";
import AKLogoBlack from "../assets/images/ak-logo-black.svg?react";
import AKLogoWhite from "../assets/images/ak-logo-white.svg?react";
import "./App.css";

function App() {
	const [messagesFromExtension, setMessagesFromExtension] = useState<any>([]);
	const [deployments, setDeployments] = useState<Deployment[] | undefined>();
	const [project, setProject] = useState<Project | undefined>();
	const [directory, setDirectory] = useState<string>("");
	const [themeVisualType, setThemeVisualType] = useState<number | undefined>();

	/**
	 * Handles incoming messages from the extension.
	 * @param {MessageEvent<Message>} event - The message event.
	 */
	const handleMessagesFromExtension = useCallback(
		(event: MessageEvent<Message>) => {
			const { payload } = event.data as Message;

			switch (event.data.type) {
				case MessageType.common:
					setDirectory(payload as string);
					break;
				case MessageType.theme:
					setThemeVisualType(payload as Theme);
					break;
				case MessageType.deployments:
					setDeployments(payload as Deployment[]);
					break;
				case MessageType.project:
					setProject(payload as Project);
					break;
				default:
			}
		},
		[messagesFromExtension]
	);

	useEffect(() => {
		/**
		 * Adds an event listener for incoming messages from the extension.
		 * @param {MessageEvent<Message>} event - The message event.
		 */
		window.addEventListener("message", (event: MessageEvent<Message>) => {
			handleMessagesFromExtension(event);
		});

		return () => {
			/**
			 * Removes the event listener for incoming messages from the extension.
			 */
			window.removeEventListener("message", handleMessagesFromExtension);
		};
	}, [handleMessagesFromExtension]);

	/**
	 * Sends a message to the extension to validate the path.
	 */
	const validatePath = () => {
		vscodeWrapper.postMessage({
			command: "isReadyToBuild",
		});
	};

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

	/**
	 * Opens the add webview pane in the extension.
	 */
	const openAddWebviewPane = () => {
		vscodeWrapper.postMessage({
			command: "openAddWebviewPane",
		});
	};

	const deployProject = () => {
		vscodeWrapper.postMessage({
			type: MessageType.deployProject,
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
						<AKButton classes="mx-4">
							<div className="codicon codicon-tools mr-2"></div>
							Build
						</AKButton>
						<AKButton onClick={deployProject}>
							<div className="codicon codicon-play mr-2"></div>
							Deploy
						</AKButton>
					</div>
				</div>
				<Deployments deployments={deployments} />
			</div>
		</main>
	);
}

export default App;
