import { window } from "vscode";
import { projectService } from "../services";

export const messageListener = async (message: any) => {
	const command = message.command;
	const text = message.text;

	switch (command) {
		case "hello":
			const res = await projectService.list("u:130f562491dc11eea44612584eb0c4b9");
			console.log(res);
			window.showInformationMessage(text);
			return;
		// Add more switch case statements here as more webview message commands
		// are created within the webview context (i.e. inside media/main.js)
	}
};
