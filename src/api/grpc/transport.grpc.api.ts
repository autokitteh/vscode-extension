import { commands } from "vscode";

import { Interceptor, ConnectError, Code } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-node";
import { vsCommands, namespaces } from "@constants";
import { translate } from "@i18n";
import { LoggerService } from "@services";
import { WorkspaceConfig, getBaseURL, getOrganizationId } from "@utilities";

/**
 * Extract the first value from ConnectError metadata headers.
 *
 * The HTTP Headers standard allows multiple values to be sent as comma-separated strings.
 * This function handles three cases:
 * 1. Header doesn't exist → returns empty string
 * 2. Header has single value → returns trimmed value
 * 3. Header has multiple comma-separated values → returns first trimmed value
 *
 * @param error - The ConnectError containing metadata headers
 * @param key - The header key to extract (e.g., "x-error-type")
 * @returns The first trimmed value, or empty string if header doesn't exist
 */
export function getFirstMetadataValue(error: ConnectError, key: string): string {
	const value = error.metadata.get(key);
	return value ? value.split(",")[0].trim() : "";
}

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
		if (!(error instanceof ConnectError)) {
			throw error;
		}
		const userId = WorkspaceConfig.getFromWorkspace<string>("userId", "");
		const requestPath = req.url;

		// Log only - let callers handle UI messages to avoid duplicates
		if (error.code === Code.Unauthenticated) {
			LoggerService.error(
				namespaces.authentication,
				translate().t("errors.unauthenticatedLog", {
					userId: userId || "unknown",
					request: requestPath,
				})
			);
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
			throw error;
		}

		const responseErrorType = getFirstMetadataValue(error, "x-error-type");

		if (error.code === Code.ResourceExhausted && !responseErrorType) {
			LoggerService.error(
				namespaces.authentication,
				translate().t("errors.resourceExhaustedLog", {
					userId: userId || "unknown",
					request: requestPath,
				})
			);
			throw error;
		}

		switch (responseErrorType) {
			case "rate_limit_exceeded":
				LoggerService.error(
					namespaces.authentication,
					translate().t("errors.rateLimitExceededLog", {
						userId: userId || "unknown",
						request: requestPath,
					})
				);
				throw error;
			case "quota_limit_exceeded": {
				const quotaLimit = getFirstMetadataValue(error, "x-quota-limit");
				const quotaLimitUsed = getFirstMetadataValue(error, "x-quota-used");
				const quotaLimitResource = getFirstMetadataValue(error, "x-quota-resource");

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
				throw error;
			}
			default:
				throw error;
		}
	}
};

let _grpcTransport: ReturnType<typeof createConnectTransport> | null = null;

export function getGrpcTransport() {
	if (!_grpcTransport) {
		_grpcTransport = createConnectTransport({
			baseUrl: getBaseURL() || "http://localhost:8080",
			httpVersion: "1.1",
			interceptors: [jwtInterceptor, errorInterceptor],
		});
	}
	return _grpcTransport;
}

export const grpcTransport = new Proxy({} as ReturnType<typeof createConnectTransport>, {
	get(target, prop) {
		return getGrpcTransport()[prop as keyof ReturnType<typeof createConnectTransport>];
	},
});
