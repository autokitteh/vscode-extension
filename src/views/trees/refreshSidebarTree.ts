import { TreeProvider } from "@views/index";
import { window } from "vscode";

export const refreshSidebarTree = (newTree: TreeProvider) =>
	window.registerTreeDataProvider("autokittehSidebarTree", newTree);
