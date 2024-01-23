import { ConnectError } from "@connectrpc/connect";
import { namespaces, vsCommands } from "@constants";
import { gRPCErrors } from "@constants/api.constants";
import { ServiceResponse } from "@type/services.types";
import { commands } from "vscode";

export class RequestHandler {
	static disconnectedErrorDisplayed: boolean = false;

	static async handleServiceResponse<T>(
		requestPromise: () => Promise<ServiceResponse<T>>,
		messages?: {
			onSuccessMessage?: string;
			onFailureMessage?: string;
		}
	): Promise<{ data: T | undefined; error: unknown }> {
		try {
			const { data, error } = await requestPromise();

			if (error) {
				this.handleError(error);
				return Promise.resolve({ data: undefined, error: error });
			} else {
				this.handleSuccess(data, messages?.onSuccessMessage);
				return Promise.resolve({ data: data, error: undefined });
			}
		} catch (error) {
			this.handleError(error);
			return Promise.resolve({ data: undefined, error });
		}
	}

	private static handleSuccess<T>(data: T, successMessage?: string): void {
		if (successMessage) {
			let displayedMessage = successMessage;
			if (typeof data === "string" && this.isDataStringId(data)) {
				displayedMessage = `${displayedMessage}: ${data}`;
			}
			commands.executeCommand(
				vsCommands.showInfoMessage,
				namespaces.serverRequests,
				displayedMessage
			);
		}
	}

	private static isDataStringId(data: string): boolean {
		return /p:|s:|d:/.test(data);
	}

	private static handleError(error: unknown): void {
		if (
			error instanceof ConnectError &&
			error.code === gRPCErrors.serverNotRespond &&
			!this.disconnectedErrorDisplayed
		) {
			commands.executeCommand(vsCommands.showErrorMessage, namespaces.connection, error.message);
			commands.executeCommand(vsCommands.disconnect);
			this.disconnectedErrorDisplayed = true;
		} else if (this.isErrorWithMessage(error)) {
			commands.executeCommand(
				vsCommands.showErrorMessage,
				namespaces.connection,
				`Error: ${error.message}`
			);
		}
	}

	private static isErrorWithMessage(error: unknown): error is { message: string } {
		return (
			(typeof error === "object" && error !== null && "message" in error) || error instanceof Error
		);
	}
}
