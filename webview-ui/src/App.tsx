import { vscode } from "./utilities/vscode";
import { VSCodePanels, VSCodePanelTab, VSCodePanelView } from "@vscode/webview-ui-toolkit/react";
import "./App.css";

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
				<div className="text-red-600 flex-5 ">Hello World!1</div>
				<div className="text-red-600 flex-1 ">
					<VSCodePanels>
						<VSCodePanelTab id="tab-1">
							{" "}
							<div id="icons">
								<div className="icon">
									<i className="codicon codicon-account"></i> account
								</div>
							</div>
						</VSCodePanelTab>
						<VSCodePanelTab id="tab-2">OUTPUT</VSCodePanelTab>
						<VSCodePanelTab id="tab-3">DEBUG CONSOLE</VSCodePanelTab>
						<VSCodePanelTab id="tab-4">TERMINAL</VSCodePanelTab>
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
