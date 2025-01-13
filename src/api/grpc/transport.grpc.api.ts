import { commands } from "vscode";

import { Interceptor, ConnectError } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-node";
import { vsCommands } from "@constants";
import { BASE_URL } from "@constants/api.constants";
import { WorkspaceConfig } from "@utilities";

export const jwtInterceptor: Interceptor = (next) => (req) => {
	const authToken = WorkspaceConfig.getFromWorkspace<string>("authToken", "");

	if (authToken) {
		req.header.set("Authorization", `Bearer ${authToken}`);
	}
	return next(req);
};

export const errorInterceptor: Interceptor = (next) => async (req) => {
	try {
		const response = await next(req);
		return response;
	} catch (error) {
		if (error instanceof ConnectError) {
			if ([5, 16].includes(error.code)) {
				await commands.executeCommand(vsCommands.setContext, "userId", "");
			}
		}
		throw error;
	}
};

export const grpcTransport = createConnectTransport({
	baseUrl: BASE_URL,
	httpVersion: "1.1",
	interceptors: [jwtInterceptor, errorInterceptor],
});
