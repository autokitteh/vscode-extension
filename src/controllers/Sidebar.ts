import { ProjectsService } from "@services";
import { TreeProvider } from "@views";
import { window } from "vscode";

export class Sidebar {
	static refreshSidebarTree = (newTree: TreeProvider) =>
		window.registerTreeDataProvider("autokittehSidebarTree", newTree);

	public static updateView = async (userId: string) => {
		const projectsTree = new TreeProvider(await ProjectsService.listForTree(userId));
		this.refreshSidebarTree(projectsTree);
	};
}
