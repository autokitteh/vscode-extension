import { ValidateURL } from "@utilities";
import { workspace } from "vscode";

const baseURLFromVSCode = workspace.getConfiguration().get("autokitteh.baseURL") as string;
export const BASE_URL = ValidateURL(baseURLFromVSCode) ? baseURLFromVSCode : "";

export const gRPCErrors ={
    serverNotRespond: 14, // UNAVAILABLE: Connection Failed
};