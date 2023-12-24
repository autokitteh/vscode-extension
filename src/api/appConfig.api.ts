import {
	DEFAULT_PROJECT_VIEW_REFRESH_INTERVAL,
	DEFAULT_SIDEBAR_VIEW_REFRESH_INTERVAL,
} from "@constants";
import { BASE_URL } from "@constants";
import { workspace } from "vscode";

export const baseApi = BASE_URL;
export const appConfig = {
	manifestApiBase: baseApi,
};

export const sidebarControllerRefreshRate =
	Number(workspace.getConfiguration().get("autokitteh.project.refresh.interval")) ||
	DEFAULT_SIDEBAR_VIEW_REFRESH_INTERVAL;

export const projectControllerRefreshRate =
	Number(workspace.getConfiguration().get("autokitteh.project.refresh.interval")) ||
	DEFAULT_PROJECT_VIEW_REFRESH_INTERVAL;
