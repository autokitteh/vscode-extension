import { ValidateURL } from "@utilities";
import { workspace } from "vscode";

const baseURLFromVSCode = workspace.getConfiguration().get("autokitteh.baseURL") as string;
const BASE_URL = (ValidateURL(baseURLFromVSCode) && baseURLFromVSCode) || "";

export { BASE_URL };
