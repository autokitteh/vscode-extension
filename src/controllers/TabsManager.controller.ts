import { ProjectController } from "@controllers/Project.controller";

export class TabsManagerController {
	openWebviews: { [key: string]: any };

	constructor() {
		this.openWebviews = {};
	}

	public async openWebview(projectController: ProjectController, project: SidebarTreeItem) {
		if (this.openWebviews[project.key]) {
			this.openWebviews[project.key].reveal();
		} else {
			projectController.openProject(project, this.disposeWebview);
			this.openWebviews[project.key] = projectController;
		}
	}

	private disposeWebview(projectId: string) {
		delete this.openWebviews[projectId];
	}
}
