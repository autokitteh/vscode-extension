import { useCallback, useEffect, useState } from "react";
import { AKButton } from "./components";
import {
	AKTable,
	AKTableEmptyMessage,
	AKTableCell,
	AKTableHeader,
	AKTableRow,
} from "./components/AKTable";
import { vscodeWrapper } from "./utilities/vscode";
import moment from "moment";
import { Message, MessageType, Deployment } from "../../src/types";
import AKLogoBlack from "../assets/images/ak-logo-black.svg?react";
import AKLogoWhite from "../assets/images/ak-logo-white.svg?react";
import "./App.css";

function App() {
	/**
	 * Handles the click event for the "Howdy" button - sending a message back to the extension.
	 */
	function handleHowdyClick() {
		vscodeWrapper.postMessage({
			command: "hello",
			text: "Hey there partner! 🤠",
		});
	}

	const [messagesFromExtension, setMessagesFromExtension] = useState<string[]>([]);
	const [deployments, setDeployments] = useState<Deployment[]>([]);
	const [projectName, setProjectName] = useState<string>("");
	const [directory, setDirectory] = useState<string>("");
	const [themeVisualType, setThemeVisualType] = useState<number | undefined>(undefined);

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
			<AKLogoWhite className={className} />
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
				<AKTable classes="mt-4">
					<AKTableHeader>
						<AKTableCell>Deploy Time</AKTableCell>
						<AKTableCell>Status</AKTableCell>
						<AKTableCell>Sessions</AKTableCell>
						<AKTableCell>Build-ID (Optional)</AKTableCell>
						<AKTableCell>Actions</AKTableCell>
					</AKTableHeader>
					{deployments.length === 0 && (
						<AKTableEmptyMessage>No deployments found</AKTableEmptyMessage>
					)}
					{deployments.map((deployment) => (
						<AKTableRow key={deployment.deploymentId}>
							<AKTableCell>
								{moment(deployment.createdAt).format("HH:mm:ss YYYY-MM-DD")}
							</AKTableCell>
							<AKTableCell>{deployment.state}</AKTableCell>
							<AKTableCell>0</AKTableCell>
							<AKTableCell>{deployment.buildId}</AKTableCell>
							<AKTableCell>TODO</AKTableCell>
						</AKTableRow>
					))}
				</AKTable>
			</div>
		</main>
	);
}

export default App;
