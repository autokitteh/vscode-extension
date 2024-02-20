import { namespaces, starlarkClientOptions, starlarkLSPUriScheme, starlarkLocalLSPDefaultArgs } from "@constants";
import { LoggerService } from "@services";
import { StarlarkFileHandler } from "@starlark";
import { workspace } from "vscode";
import { LanguageClient, ServerOptions } from "vscode-languageclient";

export class StarlarkLSPService {
	private static languageClient: LanguageClient | undefined = undefined;

	public static async startSocketLSPServer(serverOptions: ServerOptions, starlarkSocketLspUrl: string) {
		const lspConfigurationMessage = `(socket): ${starlarkSocketLspUrl} ${starlarkLocalLSPDefaultArgs.join(", ")}`;
		LoggerService.info(namespaces.startlarkLSPServer, `Starting LSP Server in socket mode ${lspConfigurationMessage}`);

		StarlarkLSPService.languageClient = new LanguageClient(
			"Starlark",
			"autokitteh: Starlark LSP",
			serverOptions,
			starlarkClientOptions
		);

		StarlarkLSPService.languageClient.start();

		workspace.registerTextDocumentContentProvider(
			starlarkLSPUriScheme,
			new StarlarkFileHandler(StarlarkLSPService.languageClient!)
		);
	}

	public static async startLocalLSPServer(
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
			starlarkClientOptions
		);

		StarlarkLSPService.languageClient.start();

		workspace.registerTextDocumentContentProvider(
			starlarkLSPUriScheme,
			new StarlarkFileHandler(StarlarkLSPService.languageClient!)
		);
	}
}
