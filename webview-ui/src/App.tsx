import { vscode } from "./utilities/vscode";
import { VSCodePanels, VSCodePanelTab, VSCodePanelView } from "@vscode/webview-ui-toolkit/react";
import "./App.css";
import AKLogo from "../assets/images/autokitteh-logo.svg?react";

function App() {
	function handleHowdyClick() {
		vscode.postMessage({
			command: "hello",
			text: "Hey there partner! 🤠",
		});
	}

	return (
		<main>
			<div className="flex flex-row w-full">
				<div className="text-red-600 flex-5">
					<AKLogo className="w-24 h-24" />
				</div>
				<div className="text-red-600 flex-1">
					<VSCodePanels>
						<VSCodePanelTab id="tab-1">
							{" "}
							<div id="icons">
								<div className="icon">
									<i className="codicon codicon-add"></i>
								</div>
							</div>
						</VSCodePanelTab>
						<VSCodePanelTab id="tab-2">
							{" "}
							<div id="icons">
								<div className="icon">
									<i className="codicon codicon-tools"></i>
								</div>
							</div>
						</VSCodePanelTab>
						<VSCodePanelTab id="tab-3">
							{" "}
							<div id="icons">
								<div className="icon">
									<i className="codicon codicon-symbol-interface"></i>
								</div>
							</div>
						</VSCodePanelTab>
						<VSCodePanelTab id="tab-4">
							{" "}
							<div id="icons">
								<div className="icon">
									<i className="codicon codicon-graph-line"></i>
								</div>
							</div>
						</VSCodePanelTab>
						<VSCodePanelView id="view-1">Problems content.</VSCodePanelView>
						<VSCodePanelView id="view-2">Output content.</VSCodePanelView>
						<VSCodePanelView id="view-3">Debug content.</VSCodePanelView>
						<VSCodePanelView id="view-4">Terminal content.</VSCodePanelView>
					</VSCodePanels>
				</div>
			</div>
			<h2>Test</h2>
			<button>Test</button>
		</main>
	);
}

export default App;
