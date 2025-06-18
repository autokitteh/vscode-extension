import { commands } from "vscode";

import { Interceptor, ConnectError, Code } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-node";
import { vsCommands, SUPPORT_EMAIL, namespaces } from "@constants";
import { translate } from "@i18n";
import { WorkspaceConfig, errorMessageWithLog, getBaseURL, getOrganizationId } from "@utilities";

export const jwtInterceptor: Interceptor = (next) => (req) => {
	const authToken = WorkspaceConfig.getFromWorkspace<string>("authToken", "");
	const organizationId = getOrganizationId();
	if (authToken) {
		req.header.set("Authorization", `Bearer ${authToken}`);
	}
	if (organizationId) {
		req.header.set("x-org-id", organizationId);
	}
	return next(req);
};

export const errorInterceptor: Interceptor = (next) => async (req) => {
	try {
		const response = await next(req);
		return response;
	} catch (error) {
		if (error instanceof ConnectError) {
			if ([Code.Unauthenticated, Code.PermissionDenied].includes(error.code)) {
				await commands.executeCommand(vsCommands.setContext, "userId", "");
			}

			if (error.code === Code.AlreadyExists) {
				await errorMessageWithLog(namespaces.authentication, translate().t("errors.projectAlreadyExists"));
				throw error;
			}

			if (error.code !== Code.ResourceExhausted) {
				throw error;
			}

			const responseErrorType = error?.metadata?.get("x-error-type");

			switch (responseErrorType) {
				case "rate_limit_exceeded":
					await errorMessageWithLog(namespaces.authentication, translate().t("errors.rateLimitExceeded"));

					throw error;
				case "quota_limit_exceeded": {
					const quotaLimit = error?.metadata?.get("x-quota-limit") || "";
					const quotaLimitUsed = error?.metadata?.get("x-quota-used") || "";
					const quotaLimitResource = error?.metadata?.get("x-quota-resource") || "";

					await errorMessageWithLog(
						namespaces.authentication,
						translate().t("errors.quotaLimitExceeded", {
							limit: quotaLimit,
							used: quotaLimitUsed,
							resource: quotaLimitResource,
							email: SUPPORT_EMAIL,
						})
					);

					throw error;
				}
				default:
					throw error;
			}
		}
		throw error;
	}
};

export const grpcTransport = createConnectTransport({
	baseUrl: getBaseURL() || "http://localhost:8080",
	httpVersion: "1.1",
	interceptors: [jwtInterceptor, errorInterceptor],
});
