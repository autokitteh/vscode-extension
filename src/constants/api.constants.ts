import { DEFAULT_PROJECT_VIEW_REFRESH_INTERVAL, DEFAULT_SIDEBAR_VIEW_REFRESH_INTERVAL } from "@constants";
import { DEFAULT_PROJECT_VIEW_SESSION_LOG_REFRESH_INTERVAL } from "@constants/extensionConfiguration.constants";
import { ValidateURL, getConfig } from "@utilities";

export const baseURLFromVSCode: string = getConfig<string>("autokitteh.baseURL", "");

export const BASE_URL = ValidateURL(baseURLFromVSCode) ? baseURLFromVSCode : "";

export const sidebarControllerRefreshRate: number =
	Math.max(0, getConfig<number>("autokitteh.sidebar.refresh.interval", DEFAULT_SIDEBAR_VIEW_REFRESH_INTERVAL)) * 1000;

export const projectControllerSessionsLogRefreshRate = DEFAULT_PROJECT_VIEW_SESSION_LOG_REFRESH_INTERVAL;

export const projectControllerRefreshRate: number =
	Math.max(0, getConfig<number>("autokitteh.project.refresh.interval", DEFAULT_PROJECT_VIEW_REFRESH_INTERVAL)) * 1000;
