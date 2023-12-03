import { vscode } from "./utilities/vscode";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
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
			<h1>Hello World1!</h1>
			<VSCodeButton onClick={handleHowdyClick}>Howdy1!</VSCodeButton>
			<h2>Test</h2>
			<button>Test</button>
		</main>
	);
}

export default App;
