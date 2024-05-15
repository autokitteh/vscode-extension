import { DEFAULT_PROJECT_VIEW_REFRESH_INTERVAL } from "@constants";
import { DEFAULT_PROJECT_VIEW_SESSION_LOG_REFRESH_INTERVAL } from "@constants/extensionConfiguration.constants";
import { ValidateURL, WorkspaceConfig } from "@utilities";

export const baseURLFromVSCode: string = WorkspaceConfig.getFromWorkspace<string>("baseURL", "");

export const BASE_URL = ValidateURL(baseURLFromVSCode) ? baseURLFromVSCode : "";

export const projectControllerSessionsLogRefreshRate = DEFAULT_PROJECT_VIEW_SESSION_LOG_REFRESH_INTERVAL;

export const projectControllerRefreshRate: number =
	Math.max(
		0,
		WorkspaceConfig.getFromWorkspace<number>("project.refresh.interval", DEFAULT_PROJECT_VIEW_REFRESH_INTERVAL)
	) * 1000;
