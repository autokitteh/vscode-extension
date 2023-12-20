import { TestURL } from "@utilities";
import { workspace } from "vscode";

const DEFAULT_BASE_URL = "http://localhost:9980";

const baseURLFromVSCode = workspace.getConfiguration().get("autokitteh.baseURL") as string;
const BASE_URL = TestURL(baseURLFromVSCode) || DEFAULT_BASE_URL;

export { BASE_URL };
