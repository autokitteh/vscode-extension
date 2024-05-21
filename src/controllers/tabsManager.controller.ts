import { projectControllerRefreshRate, projectControllerSessionsLogRefreshRate } from "@constants";
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
					projectControllerRefreshRate,
					projectControllerSessionsLogRefreshRate
				);
				newController.openProject(
					() => this.onProjectDispose(project.key as string),
					() => this.onProjectDelete(project.key as string)
				);
				this.openWebviews[project.key] = newController;
				return;
			}

			this.openWebviews[project.key].reveal();
		}
	}

	public enable() {
		for (const key in this.openWebviews) {
			this.openWebviews[key].enable();
		}
	}

	public reconnect() {
		for (const key in this.openWebviews) {
			this.openWebviews[key].reconnect();
		}
	}

	public onProjectDelete(controllerId: string) {
		this.openWebviews[controllerId].view.panel.dispose();
	}

	public disable() {
		for (const key in this.openWebviews) {
			this.openWebviews[key].disable();
		}
	}

	private onProjectDispose(controllerId: string) {
		delete this.openWebviews[controllerId];
	}
}
