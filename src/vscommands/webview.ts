import { AppSync } from "@controllers/AppSync";
import { translate } from "@i18n";
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
		`${translate().t("general.companyName")}: ${selectedProject}`,
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
