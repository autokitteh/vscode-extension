import { AppSync } from "@controllers/AppSync";
import { LocalhostConnection } from "@type/connection";
import { ProjectWebview } from "@views";
import { themeWatcher } from "@vscommands";
import { ExtensionContext } from "vscode";

export const openWebview = async (
	selectedProject: string,
	currentProjectView: typeof ProjectWebview,
	context: ExtensionContext,
	connection: LocalhostConnection
): Promise<{ connection: LocalhostConnection; projectView: typeof ProjectWebview }> => {
	currentProjectView = ProjectWebview.render(
		`Autokitteh: ${selectedProject}`,
		context.extensionUri
	);
	themeWatcher(currentProjectView);

	return {
		connection: await AppSync.pollData(
			connection,
			currentProjectView?.currentPanel,
			selectedProject
		),
		projectView: currentProjectView,
	};
};
