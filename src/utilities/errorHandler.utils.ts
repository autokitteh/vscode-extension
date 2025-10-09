import { commands } from "vscode";

import { getFirstMetadataValue } from "@api";
import { Code, ConnectError } from "@connectrpc/connect";
import { vsCommands, SUPPORT_EMAIL } from "@constants";
import { translate } from "@i18n";

/**
 * Handles ConnectError by displaying appropriate error messages
 * @param error The ConnectError to handle
 * @param namespace Optional namespace for generic error messages
 * @returns true if error was handled and caller should return, false if error should be ignored (e.g., AlreadyExists)
 */
export const handleConnectError = (error: ConnectError, namespace?: string): boolean => {
	const errorType = getFirstMetadataValue(error, "x-error-type");

	if (error.code === Code.AlreadyExists) {
		// Resource already exists, caller should continue
		return false;
	}

	if (errorType === "quota_limit_exceeded") {
		const quotaLimit = getFirstMetadataValue(error, "x-quota-limit");
		const quotaLimitUsed = getFirstMetadataValue(error, "x-quota-used");
		const quotaLimitResource = getFirstMetadataValue(error, "x-quota-resource");

		commands.executeCommand(
			vsCommands.showErrorMessage,
			translate().t("errors.quotaLimitExceeded", {
				limit: quotaLimit,
				used: quotaLimitUsed,
				resource: quotaLimitResource,
				email: SUPPORT_EMAIL,
			})
		);
		return true;
	}

	if (errorType === "rate_limit_exceeded") {
		commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.rateLimitExceeded"));
		return true;
	}

	if (error.code === Code.ResourceExhausted) {
		commands.executeCommand(
			vsCommands.showErrorMessage,
			translate().t("errors.resourceExhausted", { email: SUPPORT_EMAIL })
		);
		return true;
	}

	if (error.code === Code.Unauthenticated) {
		commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.unauthenticated"));
		return true;
	}

	if (error.code === Code.PermissionDenied) {
		commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.permissionDenied"));
		return true;
	}

	// Generic error handling
	if (namespace) {
		commands.executeCommand(vsCommands.showErrorMessage, namespace, error.message);
	} else {
		commands.executeCommand(vsCommands.showErrorMessage, error.message);
	}
	return true;
};
