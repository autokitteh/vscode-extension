import {
	DEFAULT_PROJECT_VIEW_REFRESH_INTERVAL,
	DEFAULT_SIDEBAR_VIEW_REFRESH_INTERVAL,
} from "@constants";
import { workspace } from "vscode";

export const sidebarControllerRefreshRate =
	Number(workspace.getConfiguration().get("autokitteh.project.refresh.interval")) ||
	DEFAULT_SIDEBAR_VIEW_REFRESH_INTERVAL;

export const projectControllerRefreshRate =
	Number(workspace.getConfiguration().get("autokitteh.project.refresh.interval")) ||
	DEFAULT_PROJECT_VIEW_REFRESH_INTERVAL;
