import { projectControllerRefreshRate } from "@constants/api.constants";
import { ProjectController } from "@controllers";
import { SidebarTreeItem } from "@type/views";
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
		if (project.key) {
			if (!this.openWebviews[project.key]) {
				const newView = new ProjectView(this.context);

				const newController = new ProjectController(
					newView,
					project.key,
					projectControllerRefreshRate
				);
				newController.openProject(() => this.disposeWebview(project.key as string));
				this.openWebviews[project.key] = newController;
				return;
			}

			this.openWebviews[project.key].reveal();
		}
	}

	private disposeWebview(controllerId: string) {
		delete this.openWebviews[controllerId];
	}
}