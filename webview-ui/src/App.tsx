import { useCallback, useEffect, useState } from "react";
import { AKButton } from "./components";
import Deployments from "./sections/AKDeployments";
import { vscodeWrapper } from "./utilities/vscode";
import { Deployment } from "../../src/autokitteh/proto/gen/ts/autokitteh/deployments/v1/deployment_pb";
import { Message, MessageType } from "../../src/types";
import AKLogoBlack from "../assets/images/ak-logo-black.svg?react";
import AKLogoWhite from "../assets/images/ak-logo-white.svg?react";
import "./App.css";

function App() {
	const [messagesFromExtension, setMessagesFromExtension] = useState<string[]>([]);
	const [deployments, setDeployments] = useState<Deployment[] | undefined>();
	const [projectName, setProjectName] = useState<string | undefined>();
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
					setDirectory(payload);
					break;
				case MessageType.theme:
					setThemeVisualType(payload);
					break;
				case MessageType.deployments:
					setDeployments(payload);
					break;
				case MessageType.projectName:
					setProjectName(payload);
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
		themeVisualType === 2 ? (
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

	return (
		<main>
			<div className="flex flex-col w-full">
				<div className="flex mr-8">
					<div className="flex items-center">
						<Logo className="w-12 h-12" />
						<div className="text-vscode-input-foreground font-bold ml-4 text-lg">{projectName}</div>
						<AKButton classes="mx-4">
							<div className="codicon codicon-tools mr-2"></div>
							Build
						</AKButton>
						<AKButton>
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
