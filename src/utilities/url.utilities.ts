import { ValidateURL } from "@utilities/validateUrl.utils";
import { WorkspaceConfig } from "@utilities/workspaceConfig.util";

export function getBaseURL(): string {
	const baseURLFromVSCode = WorkspaceConfig.getFromWorkspace<string>("baseURL", "");
	return ValidateURL(baseURLFromVSCode) ? baseURLFromVSCode : "";
}
export function getOrganizationId(): string {
	const organizationIdFromVSCode = WorkspaceConfig.getFromWorkspace<string>("organizationId", "");
	return organizationIdFromVSCode;
}

export function getWebUIURL(): string {
	const webUIURLFromVSCode = WorkspaceConfig.getFromWorkspace<string>("webInterfaceURL", "");
	const baseURL = getBaseURL();

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

	if (ValidateURL(webUIURLFromVSCode)) {
		return webUIURLFromVSCode;
	}

	return "http://localhost:9982";
}
