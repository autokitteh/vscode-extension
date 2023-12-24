import { DEFAULT_SIDEBAR_VIEW_REFRESH_INTERVAL } from "@constants";
import { ProjectController } from "@controllers";
import { projectControllerRefreshRate } from "@utilities/getControllersRefreshRate.utils";
import { ProjectView } from "@views";
import { ExtensionContext } from "vscode";

export class TabsManagerController {
	openWebviews: { [key: string]: any };
	context: ExtensionContext;

	constructor(context: ExtensionContext) {
		this.openWebviews = {};
		this.context = context;
		this.disposeWebview = this.disposeWebview.bind(this);
	}

	public async openWebview(project: SidebarTreeItem) {
		if (!this.openWebviews[project.key]) {
			const newView = new ProjectView(this.context);

			const newController = new ProjectController(
				newView,
				project.key,
				projectControllerRefreshRate
			);
			newController.openProject(this.disposeWebview);
			this.openWebviews[project.key] = newController;
			return;
		}

		this.openWebviews[project.key].reveal();
	}

	private disposeWebview(projectId: string) {
		delete this.openWebviews[projectId];
	}
}
