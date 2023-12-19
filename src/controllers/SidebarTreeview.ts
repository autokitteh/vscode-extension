import { ProjectsService } from "@services";
import { TreeProvider } from "@views";
import { window } from "vscode";

export class Sidebar {
	public static updateView = async (userId: string) => {
		const projectsTree = new TreeProvider(await ProjectsService.listForTree(userId));
		window.registerTreeDataProvider("autokittehSidebarTree", projectsTree);
	};
}
