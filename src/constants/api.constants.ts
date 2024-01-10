import {
	DEFAULT_PROJECT_VIEW_REFRESH_INTERVAL,
	DEFAULT_SIDEBAR_VIEW_REFRESH_INTERVAL,
} from "@constants";
import {
	DEFAULT_CONNECTION_TEST_INTERVAL,
	DEFAULT_CONNECTION_TEST_SLOW_INTERVAL,
} from "@constants/extensionConfiguration.constants";
import { ValidateURL } from "@utilities";
import { workspace } from "vscode";

const baseURLFromVSCode = workspace.getConfiguration().get("autokitteh.baseURL") as string;
export const BASE_URL = ValidateURL(baseURLFromVSCode) ? baseURLFromVSCode : "";

export const gRPCErrors = {
	serverNotRespond: 14, // UNAVAILABLE: Connection Failed
};

export const sidebarControllerRefreshRate =
	Number(workspace.getConfiguration().get("autokitteh.sidebar.refresh.interval")) >= 0
		? Number(workspace.getConfiguration().get("autokitteh.sidebar.refresh.interval")) * 1000
		: DEFAULT_SIDEBAR_VIEW_REFRESH_INTERVAL;

export const projectControllerRefreshRate =
	Number(workspace.getConfiguration().get("autokitteh.project.refresh.interval")) >= 0
		? Number(workspace.getConfiguration().get("autokitteh.project.refresh.interval")) * 1000
		: DEFAULT_PROJECT_VIEW_REFRESH_INTERVAL;
export const connectionHandlerInterval =
	Number(workspace.getConfiguration().get("autokitteh.connectionTest.initial.interval.duration")) >=
	0
		? Number(
				workspace.getConfiguration().get("autokitteh.connectionTest.initial.interval.duration")
			)
		: DEFAULT_CONNECTION_TEST_INTERVAL;
export const connectionHandlerSlowInterval =
	Number(workspace.getConfiguration().get("autokitteh.connectionTest.initial.interval.duration")) >=
	0
		? Number(workspace.getConfiguration().get("autokitteh.connectionTest.interval.duration.slow"))
		: DEFAULT_CONNECTION_TEST_SLOW_INTERVAL;
