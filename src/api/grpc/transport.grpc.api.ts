import { commands } from "vscode";

import { Interceptor, ConnectError, Code } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-node";
import { vsCommands, SUPPORT_EMAIL, namespaces } from "@constants";
import { translate } from "@i18n";
import { LoggerService } from "@services";
import { WorkspaceConfig, getBaseURL, getOrganizationId } from "@utilities";

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
			const userId = WorkspaceConfig.getFromWorkspace<string>("userId", "");
			const requestPath = req.url;

			if (error.code === Code.Unauthenticated) {
				LoggerService.error(
					namespaces.authentication,
					translate().t("errors.unauthenticatedLog", {
						userId: userId || "unknown",
						request: requestPath,
					})
				);
				await commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.unauthenticated"));
				await commands.executeCommand(vsCommands.setContext, "userId", "");
				throw error;
			}

			if (error.code === Code.PermissionDenied) {
				LoggerService.error(
					namespaces.authentication,
					translate().t("errors.permissionDeniedLog", {
						userId: userId || "unknown",
						request: requestPath,
					})
				);
				await commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.permissionDenied"));
				await commands.executeCommand(vsCommands.setContext, "userId", "");
				throw error;
			}

			if (error.code === Code.AlreadyExists) {
				LoggerService.error(
					namespaces.authentication,
					translate().t("errors.projectAlreadyExistsLog", {
						userId: userId || "unknown",
						request: requestPath,
					})
				);
				await commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.projectAlreadyExists"));
				throw error;
			}

			if (error.code !== Code.ResourceExhausted) {
				throw error;
			}

			const responseErrorType = error?.metadata?.get("x-error-type");

			switch (responseErrorType) {
				case "rate_limit_exceeded":
					LoggerService.error(
						namespaces.authentication,
						translate().t("errors.rateLimitExceededLog", {
							userId: userId || "unknown",
							request: requestPath,
						})
					);
					await commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.rateLimitExceeded"));
					throw error;
				case "quota_limit_exceeded": {
					const quotaLimit = error?.metadata?.get("x-quota-limit") || "";
					const quotaLimitUsed = error?.metadata?.get("x-quota-used") || "";
					const quotaLimitResource = error?.metadata?.get("x-quota-resource") || "";

					LoggerService.error(
						namespaces.authentication,
						translate().t("errors.quotaLimitExceededLog", {
							userId: userId || "unknown",
							request: requestPath,
							resource: quotaLimitResource,
							used: quotaLimitUsed,
							limit: quotaLimit,
						})
					);
					await commands.executeCommand(
						vsCommands.showErrorMessage,
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
