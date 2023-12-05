import { window } from "vscode";
import { projectService } from "../services";
import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs";
import { get } from "lodash";
const editorLangId = vscode.window.activeTextEditor?.document.languageId;

export const messageListener = async (message: any) => {
	const command = message.command;
	const text = message.text;
	const dirPath = path.join(`${message.projectDirectory}/${message.name}`);
	const currentFileDir = get(vscode, "workspace.workspaceFolders[0].uri.path", undefined);

	switch (command) {
		case "hello":
			const res = await projectService.list("u:130f562491dc11eea44612584eb0c4b9");
			console.log(res);
			window.showInformationMessage(text);
			break;

		case "submitNewProject":
			console.log(message);
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
			const projectName = "reviewkitteh";
			console.log(editorLangId === "yaml");
			console.log(fs.existsSync(`${currentFileDir}/${projectName}/autokitteh.yaml`));
			console.log(fs.existsSync(`${currentFileDir}/${projectName}/main.star`));
			break;
	}
};
