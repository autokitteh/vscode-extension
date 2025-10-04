import * as path from "path";
import * as vscode from "vscode";

export class ProjectMapper {
	private scopePaths: string[] = [];

	refreshFromConfig(): void {
		const config = vscode.workspace.getConfiguration("autokitteh");
		const projectsPathsRaw = config.get<string>("projectsPaths", "{}");

		try {
			const projectsPathsObj = JSON.parse(projectsPathsRaw);
			this.scopePaths = Object.values(projectsPathsObj).filter((p): p is string => typeof p === "string");
		} catch {
			this.scopePaths = [];
		}
	}

	isInScope(uri: vscode.Uri): boolean {
		if (this.scopePaths.length === 0) {
			return true;
		}

		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			return false;
		}

		const filePath = uri.fsPath;

		for (const workspaceFolder of workspaceFolders) {
			for (const projectPath of this.scopePaths) {
				const fullPath = path.join(workspaceFolder.uri.fsPath, projectPath);
				if (filePath.startsWith(fullPath)) {
					return true;
				}
			}
		}

		return false;
	}
}
