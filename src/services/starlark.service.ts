import { workspace } from "vscode";
import { LanguageClient, ServerOptions } from "vscode-languageclient";

import { namespaces, starlarkLSPClientOptions, starlarkLSPUriScheme, starlarkLocalLSPDefaultArgs } from "@constants";
import { LoggerService } from "@services";
import { StarlarkFileHandler } from "@starlark";

export class StarlarkLSPService {
	private static languageClient: LanguageClient | undefined = undefined;

	public static async connectLSPServerBySocket(serverOptions: ServerOptions, starlarkSocketLspUrl: string) {
		const lspConfigurationMessage = `(socket): ${starlarkSocketLspUrl} ${starlarkLocalLSPDefaultArgs.join(", ")}`;
		LoggerService.info(namespaces.startlarkLSPServer, `Starting LSP Server in socket mode ${lspConfigurationMessage}`);

		StarlarkLSPService.languageClient = new LanguageClient(
			"Starlark",
			"autokitteh: Starlark LSP",
			serverOptions,
			starlarkLSPClientOptions
		);

		StarlarkLSPService.languageClient.start();

		workspace.registerTextDocumentContentProvider(
			starlarkLSPUriScheme,
			new StarlarkFileHandler(StarlarkLSPService.languageClient!)
		);
	}

	public static async connectLSPServerLocally(
		serverOptions: ServerOptions,
		starlarkLSPVersion: string,
		starlarkLSPPath: string
	) {
		// eslint-disable-next-line max-len
		const lspConfigurationMessage = `(${starlarkLSPVersion}): ${starlarkLSPPath} ${starlarkLocalLSPDefaultArgs.join(", ")}`;
		LoggerService.info(namespaces.startlarkLSPServer, `Starting LSP Server ${lspConfigurationMessage}`);

		StarlarkLSPService.languageClient = new LanguageClient(
			"Starlark",
			"autokitteh: Starlark LSP",
			serverOptions,
			starlarkLSPClientOptions
		);

		StarlarkLSPService.languageClient.start();

		workspace.registerTextDocumentContentProvider(
			starlarkLSPUriScheme,
			new StarlarkFileHandler(StarlarkLSPService.languageClient!)
		);
	}
}
