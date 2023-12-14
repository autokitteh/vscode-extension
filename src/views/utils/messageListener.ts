import * as fs from "fs";
import * as path from "path";
import { get } from "lodash";
import * as vscode from "vscode";

export const messageListener = async (message: any) => {
	const editorLangId = vscode.window.activeTextEditor?.document.languageId;
	const command = message.command;
	const text = message.text;
	const dirPath = path.join(`${message.projectDirectory}/${message.name}`);
	const currentFileDir = get(vscode, "workspace.workspaceFolders[0].uri.path", undefined);

	switch (command) {
		case "submitNewProject":
			const content = "exampleContent";
			const filePath = path.join(`${message.projectDirectory}/${message.name}`, "test.yaml");

			if (fs.existsSync(dirPath)) {
				return;
			}
			if (!fs.existsSync(dirPath)) {
				fs.mkdirSync(dirPath, { recursive: true });
				fs.writeFileSync(filePath, content, "utf8");
			}

			const openPath = vscode.Uri.file(filePath);
			vscode.workspace.openTextDocument(openPath).then((doc) => {
				vscode.window.showTextDocument(doc);
			});
			break;

		// Check if the project is ready to be built - if so, build it
		case "isReadyToBuild":
			console.log(editorLangId === "yaml");
			console.log(fs.existsSync(`${currentFileDir}/autokitteh.yaml`));
			console.log(fs.existsSync(`${currentFileDir}/main.star`));
			break;
	}
};
