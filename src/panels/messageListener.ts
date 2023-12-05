import { window } from "vscode";
import { projectService } from "../services";
import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs";

export const messageListener = async (message: any) => {
	const command = message.command;
	const text = message.text;

	switch (command) {
		case "hello":
			const res = await projectService.list("u:130f562491dc11eea44612584eb0c4b9");
			console.log(res);
			window.showInformationMessage(text);
		case "submitNewProject":
			console.log(message);
			const content = "exampleContent";
			// @ts-ignore-next-line
			const projectRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;

			// /Users/ronenmars/Desktop/dev/test2
			const filePath = path.join(`${message.projectDirectory}/${message.name}`, "test.yaml");
			const dirPath = path.join(`${message.projectDirectory}/${message.name}`);

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
	}
};
