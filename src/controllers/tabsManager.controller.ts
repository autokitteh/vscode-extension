import { ExtensionContext } from "vscode";

import { ProjectController } from "@controllers";
import { SidebarTreeItem } from "@type/views";
import { ProjectView } from "@views";

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

				const newController = new ProjectController(newView, project.key);
				await newController.openProject(
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

	public displayProjectCountdown(countdown: number) {
		for (const key in this.openWebviews) {
			this.openWebviews[key].updateViewWithCountdown(countdown);
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

	public dispose() {
		for (const key in this.openWebviews) {
			if (this.openWebviews[key] && this.openWebviews[key].view && this.openWebviews[key].view.panel) {
				this.openWebviews[key].view.panel.dispose();
			}
			delete this.openWebviews[key];
		}
	}
}
