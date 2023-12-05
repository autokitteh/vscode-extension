import { vscodeWrapper } from "./utilities/vscode";
import { VSCodePanels, VSCodePanelTab, VSCodePanelView } from "@vscode/webview-ui-toolkit/react";
import "./App.css";
import AKLogoBlack from "../assets/images/ak-logo-black.svg?react";
import AKLogoWhite from "../assets/images/ak-logo-white.svg?react";
import { useEffect, useState, useCallback } from "react";
import { CommonMessage, ThemeMessage, Message } from "../../src/types/message";

function App() {
	function handleHowdyClick() {
		vscodeWrapper.postMessage({
			command: "hello",
			text: "Hey there partner! 🤠",
		});
	}
	const [messagesFromExtension, setMessagesFromExtension] = useState<string[]>([]);

	/*** THEME_TYPES:
	 * 1 - light
	 * 2 - dark
	 * 3 - high contrast
	 */
	const [themeVisualType, setThemeVisualType] = useState<number | undefined>(undefined);

	const handleMessagesFromExtension = useCallback(
		(event: MessageEvent<Message>) => {
			if (event.data.type === "COMMON") {
				const { payload } = event.data as CommonMessage;
				setDirectory(payload);
			}
			console.log("message", event);
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

	const submit = () => {
		vscodeWrapper.postMessage({
			command: "submitNewProject",
			name: projectName,
			projectDirectory: directory,
		});
	};

	const validatePath = () => {
		vscodeWrapper.postMessage({
			command: "isReadyToBuild",
			name: projectName,
			projectDirectory: directory,
		});
	};

	const Logo = ({ className }: { className: string }) =>
		themeVisualType === 2 ? (
			<AKLogoWhite className={className} />
		) : (
			<AKLogoBlack className={className} />
		);

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
						<div id="iconWrapper pointer">
							<div className="icon">
								<i className="codicon codicon-add !text-4xl"></i>
							</div>
						</div>
						<div id="iconWrapper pointer">
							<div className="icon">
								<i className="codicon codicon-tools !text-4xl"></i>
							</div>
						</div>
						<div id="iconWrapper pointer">
							<div className="icon">
								<i className="codicon codicon-symbol-interface !text-4xl"></i>
							</div>
						</div>
						<div id="iconWrapper pointer">
							<div className="icon">
								<i className="codicon codicon-graph-line !text-4xl"></i>
							</div>
						</div>
					</div>
					<VSCodePanels>
						<VSCodePanelTab id="tab-1">
							<div id="iconWrapper">
								<div className="icon">
									<i className="codicon codicon-add"></i>
								</div>
							</div>
						</VSCodePanelTab>
						<VSCodePanelTab id="tab-2">
							<div id="iconWrapper">
								<div className="icon">
									<i className="codicon codicon-tools"></i>
								</div>
							</div>
						</VSCodePanelTab>
						<VSCodePanelTab id="tab-3">
							<div id="iconWrapper">
								<div className="icon">
									<i className="codicon codicon-symbol-interface"></i>
								</div>
							</div>
						</VSCodePanelTab>
						<VSCodePanelTab id="tab-4">
							<div id="iconWrapper">
								<div className="icon">
									<i className="codicon codicon-graph-line"></i>
								</div>
							</div>
						</VSCodePanelTab>
						<VSCodePanelView id="view-1">
							<div>
								Pick a directory:
								<input
									type="text"
									className="text-white"
									disabled
									value={directory}
									onChange={(e) => setDirectory(e.target.value)}
								/>
							</div>
							<div>
								Type the project name here (sub-directory):
								<input type="text" onChange={(e) => setProjectName(e.target.value)} />
							</div>
							<div>
								<button onClick={submit}>Submit</button>
							</div>
						</VSCodePanelView>
						<VSCodePanelView id="view-2">{messagesFromExtension}</VSCodePanelView>
						<VSCodePanelView id="view-3">Debug content.</VSCodePanelView>
						<VSCodePanelView id="view-4">Terminal content.</VSCodePanelView>
					</VSCodePanels>
				</div>
			</div>
		</main>
	);
}

export default App;
