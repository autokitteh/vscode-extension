import { DEFAULT_INTERVAL_LENGTH } from "@constants/extension-configuration";
import { AuthorizationService, ProjectsService } from "@services";
import { SidebarView } from "@views";
import { ISidebarView } from "interfaces/Sidebar.interface";
import { ConfigurationTarget, window, workspace } from "vscode";

export class SidebarController {
	private view: ISidebarView;
	private intervalTimerId: NodeJS.Timeout | undefined;

	constructor(private sidebarView: ISidebarView) {
		this.view = sidebarView;
		window.registerTreeDataProvider("autokittehSidebarTree", this.view);
	}

	public connect = async () => {
		await workspace
			.getConfiguration()
			.update("autokitteh.serviceEnabled", true, ConfigurationTarget.Global);

		const INTERVAL_LENGTH =
			((await workspace.getConfiguration().get("autokitteh.intervalLength")) as number) ||
			DEFAULT_INTERVAL_LENGTH;

		this.intervalTimerId = setInterval(async () => {
			const myUser = await AuthorizationService.whoAmI();
			if (myUser && myUser.userId) {
				this.view = new SidebarView();

				this.view.load(await ProjectsService.listForTree(myUser.userId));
				window.registerTreeDataProvider("autokittehSidebarTree", this.view);
			}
		}, INTERVAL_LENGTH);
	};

	public disconnect = async () => {
		await workspace
			.getConfiguration()
			.update("autokitteh.serviceEnabled", false, ConfigurationTarget.Global);

		if (this.intervalTimerId) {
			clearInterval(this.intervalTimerId);
		}

		this.view = new SidebarView();
		window.registerTreeDataProvider("autokittehSidebarTree", this.view);
	};
}
