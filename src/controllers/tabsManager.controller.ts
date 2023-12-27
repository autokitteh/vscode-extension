import { ProjectController } from "@controllers";
import { ProjectView } from "@views";
import { ExtensionContext, workspace } from "vscode";

export class TabsManagerController {
	openWebviews: { [key: string]: any };
	context: ExtensionContext;

	constructor(context: ExtensionContext) {
		this.openWebviews = {};
		this.context = context;
	}

	public async openWebview(project: SidebarTreeItem) {
		if (!this.openWebviews[project.key]) {
			const newView = new ProjectView(this.context);

			const newController = new ProjectController(
				newView,
				project.key,
				Number(workspace.getConfiguration().get("autokitteh.project.refresh.interval"))
			);
			newController.openProject(() => this.disposeWebview(project.key));
			this.openWebviews[project.key] = newController;
			return;
		}

		this.openWebviews[project.key].reveal();
	}

	private disposeWebview(controllerId: string) {
		delete this.openWebviews[controllerId];
	}
}
