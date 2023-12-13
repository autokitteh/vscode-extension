import { AKWebview, MyTreeStrProvider } from "@panels/index";
import { ExtensionContext, window } from "vscode";

export const refreshSidebarTree = (
	newTree: MyTreeStrProvider,
	context: ExtensionContext
): AKWebview => {
	const projectsSidebarTree = window.registerTreeDataProvider(
		"autokittehSidebarTree",
		newTree
	) as AKWebview;

	context.subscriptions.push(projectsSidebarTree);
	return projectsSidebarTree;
};
