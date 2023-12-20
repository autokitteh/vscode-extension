import { ProjectController } from "@controllers";
import { ProjectsService } from "@services";
import { ProjectView } from "@views";
import { ExtensionContext } from "vscode";

export class TabsManagerController {
	openWebviews: { [key: string]: any };
	context: ExtensionContext;

	constructor(context: ExtensionContext) {
		this.openWebviews = {};
		this.context = context;
	}

	public async openWebview(project: SidebarTreeItem) {
		if (this.openWebviews[project.key]) {
			this.openWebviews[project.key].reveal();
		} else {
			const newProjectView = new ProjectView(this.context);
			const projectObj = await ProjectsService.get(project.key);
			if (projectObj) {
				const newProjectController = new ProjectController(newProjectView, projectObj);
				newProjectController.openProject(this.disposeWebview);
				this.openWebviews[project.key] = newProjectController;
			}
		}
	}

	private disposeWebview(projectId: string) {
		delete this.openWebviews[projectId];
	}
}
