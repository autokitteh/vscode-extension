import { TestURL } from "@utilities";
import { workspace } from "vscode";

const DEFAULT_HOST_URL = "http://localhost:9980";

const hostConfig = workspace.getConfiguration().get("autokitteh.baseURL") as string;
const HOST_URL = TestURL(hostConfig) || DEFAULT_HOST_URL;

const URL_PREFIX = "autokitteh.";

export { HOST_URL, URL_PREFIX };
