// import { AppSync } from "@controllers/AppSync";
// import { translate } from "@i18n";
// import { LocalhostConnection } from "@type/connection";
// import { ProjectWebview } from "@views";
// import { themeWatcher } from "@vscommands";
// import { ExtensionContext } from "vscode";

// export const openWebview = async (
// 	selectedProject: string,
// 	currentWebview: typeof ProjectWebview,
// 	context: ExtensionContext,
// 	connection: LocalhostConnection
// ): Promise<{ connection: LocalhostConnection; projectView: typeof ProjectWebview }> => {
// 	currentWebview = ProjectWebview.render(
// 		`${translate().t("general.companyName")}: ${selectedProject}`,
// 		context.extensionUri
// 	);
// 	themeWatcher(currentWebview);

// 	return {
// 		connection: await AppSync.pollData(connection, currentWebview?.currentPanel, selectedProject),
// 		projectView: currentWebview,
// 	};
// };
