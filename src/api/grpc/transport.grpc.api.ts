import { commands, window } from "vscode";

import { Interceptor, ConnectError } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-node";
import { vsCommands, namespaces, BASE_URL } from "@constants";
import { translate } from "@i18n";
import { LoggerService } from "@services";
import { WorkspaceConfig } from "@utilities";

export const jwtInterceptor: Interceptor = (next) => (req) => {
	const authToken = WorkspaceConfig.getFromWorkspace<string>("authToken", "");

	if (authToken) {
		req.header.set("Authorization", `Bearer ${authToken}`);
	}
	return next(req);
};

const handleErrorWithMessage = async (translationKey: string) => {
	const message = translate().t(translationKey);
	LoggerService.info(namespaces.serverRequests, message);
	await window.showErrorMessage(message);
};

export const errorInterceptor: Interceptor = (next) => async (req) => {
	try {
		const response = await next(req);
		return response;
	} catch (error) {
		if (error instanceof ConnectError) {
			if (error.code === 16) {
				await commands.executeCommand(vsCommands.setContext, "userId", "");
			}

			if (error.code === 6) {
				await handleErrorWithMessage("errors.projectAlreadyExists");
				throw error;
			}

			if (error.code === 8) {
				await handleErrorWithMessage("errors.rateLimitExceeded");
				throw error;
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
