import { User } from "@ak-proto-ts/users/v1/user_pb";
import { DEFAULT_SIDEBAR_VIEW_REFRESH_INTERVAL } from "@constants/extension-configuration";
import { AuthorizationService, ProjectsService } from "@services";
import { ISidebarView } from "interfaces";
import isEqual from "lodash/isEqual";
import { ConfigurationTarget, window, workspace } from "vscode";

export class SidebarController {
	private view: ISidebarView;
	private intervalTimerId?: NodeJS.Timeout;
	private user?: User;
	private refreshRate: number;
	private projects?: SidebarTreeItem[];

	constructor(private sidebarView: ISidebarView) {
		this.view = sidebarView;
		window.registerTreeDataProvider("autokittehSidebarTree", this.view);
		this.refreshRate =
			(workspace.getConfiguration().get("autokitteh.sidebar.refresh.interval") as number) ||
			DEFAULT_SIDEBAR_VIEW_REFRESH_INTERVAL;
	}

	public connect = async () => {
		workspace
			.getConfiguration()
			.update("autokitteh.serviceEnabled", true, ConfigurationTarget.Global);

		this.user = await AuthorizationService.whoAmI();

		this.intervalTimerId = setInterval(async () => {
			if (this.user) {
				const projectsForUser = await ProjectsService.listForTree(this.user.userId);
				if (!isEqual(projectsForUser, this.projects)) {
					this.projects = projectsForUser;
					this.view.refresh(projectsForUser);
				}
			}
		}, this.refreshRate);
	};

	public disconnect = async () => {
		workspace
			.getConfiguration()
			.update("autokitteh.serviceEnabled", false, ConfigurationTarget.Global);

		if (this.intervalTimerId) {
			clearInterval(this.intervalTimerId);
		}

		this.view.refresh([]);
	};
}
