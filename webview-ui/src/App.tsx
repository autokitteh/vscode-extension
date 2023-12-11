import { vscodeWrapper } from "./utilities/vscode";
import { Message, MessageType } from "../../src/types/message";
import AKLogoBlack from "../assets/images/ak-logo-black.svg?react";
import AKLogoWhite from "../assets/images/ak-logo-white.svg?react";

import "./App.css";

import { useCallback, useEffect, useState } from "react";

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

	const [themeVisualType, setThemeVisualType] = useState<number | undefined>(undefined);

	/**
	 * Handles incoming messages from the extension.
	 * @param {MessageEvent<Message>} event - The message event.
	 */
	const handleMessagesFromExtension = useCallback(
		(event: MessageEvent<Message>) => {
			console.log(event.data);

			if (event.data.type === MessageType.common) {
				const { payload } = event.data as Message;
				setDirectory(payload as string);
			}
			if (event.data.type === MessageType.theme) {
				const { payload } = event.data as Message;
				setThemeVisualType(payload as number);
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

	const [projectName, setProjectName] = useState("");
	const [directory, setDirectory] = useState("");

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
						<div className="text-vscode-input-foreground font-bold ml-4 text-lg">Autokitteh</div>
					</div>
				</div>

				<div className="flex">
					<button onClick={validatePath}>
						Check if project already exist in current directory
					</button>
				</div>
				<div className="flex-1">
					<div id="menu">
						<div className="flex pointer" onClick={openAddWebviewPane}>
							<div className="w-12 p-2.5">
								<i className="codicon codicon-add !text-4xl"></i>
							</div>
						</div>
						<div className="flex pointer">
							<div className="w-12 p-2.5">
								<i className="codicon codicon-tools !text-4xl"></i>
							</div>
						</div>
						<div className="flex pointer">
							<div className="w-12 p-2.5">
								<i className="codicon codicon-symbol-interface !text-4xl"></i>
							</div>
						</div>
						<div className="flex pointer">
							<div className="w-12 p-2.5">
								<i className="codicon codicon-graph-line !text-4xl"></i>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}

export default App;
