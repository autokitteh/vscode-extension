import { ValidateURL, WorkspaceConfig } from "@utilities";

export const baseURLFromVSCode: string = WorkspaceConfig.getFromWorkspace<string>("baseURL", "");
export const webUIURLFromVSCode: string = WorkspaceConfig.getFromWorkspace<string>("webInterfaceURL", "");

export const BASE_URL = ValidateURL(baseURLFromVSCode) ? baseURLFromVSCode : "";
export const WEB_UI_URL = ValidateURL(webUIURLFromVSCode) ? webUIURLFromVSCode : "";
