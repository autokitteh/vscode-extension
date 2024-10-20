import { ValidateURL, WorkspaceConfig } from "@utilities";

export const baseURLFromVSCode: string = WorkspaceConfig.getFromWorkspace<string>("baseURL", "");
export const webUIURLFromVSCode: string = WorkspaceConfig.getFromWorkspace<string>("webInterfaceURL", "");

export const BASE_URL = ValidateURL(baseURLFromVSCode) ? baseURLFromVSCode : "";

function determineWebUIURL(baseURL: string, configuredWebUIURL: string): string {
	if (!ValidateURL(baseURL)) {
		return "http://localhost:9982";
	}

	const url = new URL(baseURL);

	if (url.hostname === "api.autokitteh.cloud") {
		return "https://app.autokitteh.cloud";
	}

	if (url.hostname.endsWith("-api.autokitteh.cloud")) {
		const subdomain = url.hostname.split("-api")[0];
		return `https://${subdomain}.autokitteh.cloud`;
	}

	if (ValidateURL(configuredWebUIURL)) {
		return configuredWebUIURL;
	}

	return "http://localhost:9982";
}

export const WEB_UI_URL = determineWebUIURL(BASE_URL, webUIURLFromVSCode);
