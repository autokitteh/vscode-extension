import { useCallback, useEffect, useState } from "react";
import { CommonMessage, Message, ThemeMessage } from "../../src/types/message";
import AKLogoBlack from "../assets/images/ak-logo-black.svg?react";
import AKLogoWhite from "../assets/images/ak-logo-white.svg?react";
import "./App.css";
import { vscodeWrapper } from "./utilities/vscode";

function App() {
	function handleHowdyClick() {
		vscodeWrapper.postMessage({
			command: "hello",
			text: "Hey there partner! 🤠",
		});
	}
	const [messagesFromExtension, setMessagesFromExtension] = useState<string[]>([]);

	const [themeVisualType, setThemeVisualType] = useState<number | undefined>(undefined);

	const handleMessagesFromExtension = useCallback(
		(event: MessageEvent<Message>) => {
			if (event.data.type === "COMMON") {
				const { payload } = event.data as CommonMessage;
				setDirectory(payload);
			}
			if (event.data.type === "THEME") {
				const { payload } = event.data as ThemeMessage;
				setThemeVisualType(payload);
			}
		},
		[messagesFromExtension]
	);

	useEffect(() => {
		window.addEventListener("message", (event: MessageEvent<Message>) => {
			handleMessagesFromExtension(event);
		});

		return () => {
			window.removeEventListener("message", handleMessagesFromExtension);
		};
	}, [handleMessagesFromExtension]);

	const [projectName, setProjectName] = useState("");
	const [directory, setDirectory] = useState("");

	const validatePath = () => {
		vscodeWrapper.postMessage({
			command: "isReadyToBuild",
		});
	};

	const Logo = ({ className }: { className: string }) =>
		themeVisualType === 2 ? (
			<AKLogoWhite className={className} />
		) : (
			<AKLogoBlack className={className} />
		);

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
