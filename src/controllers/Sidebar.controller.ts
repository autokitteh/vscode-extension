import { User } from "@ak-proto-ts/users/v1/user_pb";
import { DEFAULT_SIDEBAR_VIEW_REFRESH_INTERVAL } from "@constants/extension-configuration";
import { translate } from "@i18n";
import { AuthorizationService, ProjectsService } from "@services";
import { MessageHandler } from "@views";
import { ISidebarView } from "interfaces";
import isEqual from "lodash/isEqual";
import { ConfigurationTarget, window, workspace } from "vscode";

export class SidebarController {
	private view: ISidebarView;
	private intervalTimerId?: NodeJS.Timeout;
	private user?: User;
	private refreshRate: number;
	private projects?: SidebarTreeItem[];

	constructor(sidebarView: ISidebarView) {
		this.view = sidebarView;
		window.registerTreeDataProvider("autokittehSidebarTree", this.view);
		this.refreshRate = workspace
			.getConfiguration()
			.get("autokitteh.sidebar.refresh.interval", DEFAULT_SIDEBAR_VIEW_REFRESH_INTERVAL);
		this.init().catch((error) => console.error("Failed to initialize:", error));
	}

	private async init() {
		await this.connect();
	}

	public connect = async () => {
		try {
			this.user = await AuthorizationService.whoAmI();
			if (!this.user) {
				throw new Error(translate().t("errors.noUserFound"));
			}

			this.updateServiceEnabled(true);
			this.startInterval();
		} catch (error: unknown) {
			if (error instanceof Error) {
				MessageHandler.errorMessage(error.message);
			}
		}
	};

	private startInterval() {
		this.intervalTimerId = setInterval(() => this.refreshProjects(), this.refreshRate);
	}

	private async refreshProjects() {
		try {
			if (!this.user) {
				throw new Error(translate().t("errors.noHostConnection"));
			}

			const projectsForUser = await ProjectsService.listForTree(this.user.userId);
			if (!projectsForUser.length) {
				throw new Error(translate().t("errors.noProjectsFound"));
			}

			if (!isEqual(projectsForUser, this.projects)) {
				this.projects = projectsForUser;
				this.view.refresh(projectsForUser);
			}
		} catch (error: unknown) {
			await this.disconnect();
			if (error instanceof Error) {
				MessageHandler.errorMessage(error.message);
			}
		}
	}

	public disconnect = async () => {
		this.updateServiceEnabled(false);
		this.stopInterval();
		this.view.refresh([]);
	};

	private updateServiceEnabled(enabled: boolean) {
		workspace
			.getConfiguration()
			.update("autokitteh.serviceEnabled", enabled, ConfigurationTarget.Global);
	}

	private stopInterval() {
		if (this.intervalTimerId) {
			clearInterval(this.intervalTimerId);
			this.intervalTimerId = undefined;
		}
	}
}
