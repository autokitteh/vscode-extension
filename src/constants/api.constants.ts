import { ValidateURL, WorkspaceConfig } from "@utilities";

export const baseURLFromVSCode: string = WorkspaceConfig.getFromWorkspace<string>("baseURL", "");

export const BASE_URL = ValidateURL(baseURLFromVSCode) ? baseURLFromVSCode : "";
