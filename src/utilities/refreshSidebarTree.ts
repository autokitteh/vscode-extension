import { AKWebview, MyTreeStrProvider } from "@panels/index";
import { window } from "vscode";

export const refreshSidebarTree = (newTree: MyTreeStrProvider) =>
	window.registerTreeDataProvider("autokittehSidebarTree", newTree);
