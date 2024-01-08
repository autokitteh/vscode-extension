/* eslint-disable unicorn/filename-case */
import { StarlarkfileLspClient } from "./lspClient";
import {
	CloseHandlerResult,
	ErrorHandler,
	ErrorHandlerResult,
	Message,
} from "vscode-languageclient";

export class PlaceholderErrorHandler implements ErrorHandler {
	public delegate: ErrorHandler | undefined;

	error(
		error: Error,
		message: Message | undefined,
		count: number | undefined
	): ErrorHandlerResult | Promise<ErrorHandlerResult> {
		if (this.delegate) {
			return this.delegate.error(error, message, count);
		}
		throw new Error("Delegate is undefined.");
	}

	closed(): CloseHandlerResult | Promise<CloseHandlerResult> {
		if (this.delegate) {
			return this.delegate.closed();
		}
		throw new Error("Delegate is undefined.");
	}
}

export class TiltfileErrorHandler extends PlaceholderErrorHandler {
	constructor(
		private client: StarlarkfileLspClient,
		maxRestartCount: number
	) {
		super();
		this.delegate = this.client.createDefaultErrorHandler(maxRestartCount);
	}

	async closed(): Promise<CloseHandlerResult> {
		if (this.delegate) {
			return await this.delegate.closed();
		} else {
			throw new Error("Delegate is undefined.");
		}
	}
}
