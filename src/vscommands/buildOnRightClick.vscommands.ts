import * as fs from "fs";
import * as vscode from "vscode";

export const buildOnRightClick = async (folder: { path: string }) => {
	const mainStarPath = folder.path.replace("autokitteh.yaml", "main.star");

	if (!fs.existsSync(mainStarPath)) {
		vscode.window.showErrorMessage("main.star not found");
		return;
	}
};
