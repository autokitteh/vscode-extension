import { DEFAULT_PROJECT_VIEW_REFRESH_INTERVAL } from "@constants";
import { ValidateURL, WorkspaceConfig } from "@utilities";

export const baseURLFromVSCode: string = WorkspaceConfig.getFromWorkspace<string>("baseURL", "");

export const BASE_URL = ValidateURL(baseURLFromVSCode) ? baseURLFromVSCode : "";

export const projectControllerRefreshRate: number =
	Math.max(
		0,
		WorkspaceConfig.getFromWorkspace<number>("project.refresh.interval", DEFAULT_PROJECT_VIEW_REFRESH_INTERVAL)
	) * 1000;
