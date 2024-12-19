import { commands } from "vscode";

import { Interceptor } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-node";
import { vsCommands } from "@constants";
import { BASE_URL } from "@constants/api.constants";
import { WorkspaceConfig } from "@utilities";

export const authInterceptor: Interceptor = (next) => (req) => {
	const authToken = WorkspaceConfig.getFromWorkspace<string>("authToken", "");
	const organization = WorkspaceConfig.getFromWorkspace<string>("organization", "");

	if ((authToken && !organization) || (organization && !authToken)) {
		commands.executeCommand(vsCommands.showErrorMessage, "Organization and auth token are required");
		return next(req);
	}

	req.header.set("Authorization", `Bearer ${authToken}`);
	if (req.message) {
		if ("toJsonString" in req.message) {
			const msg = JSON.parse(req.message.toJsonString());
			msg.organization = organization;
			const newReq = {
				...req,
				message: { ...req.message, ...msg },
			};
			return next(newReq);
		}
	}

	return next(req);
};

export const grpcTransport = createConnectTransport({
	baseUrl: BASE_URL,
	httpVersion: "1.1",
	interceptors: [authInterceptor],
});
