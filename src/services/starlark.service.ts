import * as fs from "fs";
import { namespaces, starlarkLSPUriScheme, starlarkLocalLSPDefaultArgs, vsCommands } from "@constants";
import { translate } from "@i18n/translation.i18n";
import {
	StarlarkSocketStreamingService,
	LoggerService,
	StarlarkVersionManagerService,
	ExtensionContextService,
} from "@services";
import { StarlarkFileHandler } from "@starlark";
import { ValidateURL, WorkspaceConfig } from "@utilities";
import { commands, workspace } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient";

export class StarlarkLSPService {
	private static languageClient: LanguageClient | undefined = undefined;
	private static starlarkLSPPath: string;

	public static async initiateLSPServer() {
		if (StarlarkLSPService.languageClient) {
			StarlarkLSPService.languageClient.stop();
		}

		let clientOptions: LanguageClientOptions = {
			documentSelector: [{ scheme: "file", language: "starlark" }],
			initializationOptions: {},
			outputChannelName: "autokitteh: Starlark LSP Server",
		};

		/* By default, the Starlark LSP operates through a CMD command in stdio mode.
		 * However, if the 'starlarkLSPSocketMode' is enabled, the LSP won't initiate automatically.
		 * Instead, VSCode connects to 'localhost:starlarkLSPPort', expecting the Starlark LSP to be running in socket mode. */
		if (ValidateURL(StarlarkLSPService.starlarkLSPPath)) {
			let serverURL = new URL(StarlarkLSPService.starlarkLSPPath);

			const port = (serverURL.port && Number(serverURL.port)) as number;
			const host = serverURL.hostname;
			if (!port || !host) {
				return;
			}

			const serverOptions = () => StarlarkSocketStreamingService.getServerOptionsStreamInfo(host, port);
			StarlarkLSPService.startLSPServer(serverOptions as ServerOptions, clientOptions, "socket");
			return;
		}

		let serverOptions = {
			command: StarlarkLSPService.starlarkLSPPath,
			args: starlarkLocalLSPDefaultArgs,
		};
		StarlarkLSPService.startLSPServer(serverOptions, clientOptions, StarlarkLSPService.starlarkLSPPath!);
	}

	private static async startLSPServer(
		serverOptions: ServerOptions,
		clientOptions: LanguageClientOptions,
		starlarkLSPVersion: string,
		starlarkLSPPath?: string
	) {
		const currentStarlarkLSPPath = starlarkLSPPath || StarlarkLSPService.starlarkLSPPath;
		const localStarlarkFileExist = fs.existsSync(currentStarlarkLSPPath);

		if (!localStarlarkFileExist && !ValidateURL(currentStarlarkLSPPath)) {
			LoggerService.error(
				namespaces.startlarkLSPServer,
				translate().t("starlark.executableNotFound", { starlarkLSPPath: currentStarlarkLSPPath })
			);
			return;
		}

		// eslint-disable-next-line max-len
		const lspConfigurationMessage = `(${starlarkLSPVersion}): ${currentStarlarkLSPPath} ${starlarkLocalLSPDefaultArgs.join(", ")}`;
		LoggerService.info(namespaces.startlarkLSPServer, `Starting LSP Server ${lspConfigurationMessage}`);

		StarlarkLSPService.languageClient = new LanguageClient(
			"Starlark",
			"autokitteh: Starlark LSP",
			serverOptions,
			clientOptions
		);

		StarlarkLSPService.languageClient.start();

		workspace.registerTextDocumentContentProvider(
			starlarkLSPUriScheme,
			new StarlarkFileHandler(StarlarkLSPService.languageClient!)
		);
	}

	public static async initStarlarkLSP(extensionContext: ExtensionContextService) {
		const { starlarkPath, starlarkLSPVersion, extensionPath } = extensionContext.getLSPConfigurations();

		const executableLSP = await StarlarkVersionManagerService.updateLSPVersionIfNeeded(
			starlarkPath,
			starlarkLSPVersion,
			extensionPath
		);

		const { path: newStarlarkPath, version: newStarlarkVersion, error } = executableLSP!;
		if (error) {
			LoggerService.error(namespaces.startlarkLSPServer, error.message);
			commands.executeCommand(vsCommands.showErrorMessage, error.message);
		}

		if (newStarlarkVersion !== starlarkLSPVersion) {
			WorkspaceConfig.setToWorkspace("starlarkLSP", newStarlarkPath);
			extensionContext.setToContext("autokitteh.starlarkLSP", newStarlarkPath);
			extensionContext.setToContext("autokitteh.starlarkVersion", newStarlarkVersion);
			LoggerService.info(
				namespaces.startlarkLSPServer,
				translate().t("starlark.executableDownloadedSuccessfully", { version: newStarlarkVersion })
			);
			commands.executeCommand(
				vsCommands.showInfoMessage,
				translate().t("starlark.executableDownloadedSuccessfully", { version: newStarlarkVersion })
			);
		}

		StarlarkLSPService.starlarkLSPPath = newStarlarkPath!;
		StarlarkLSPService.initiateLSPServer();
	}
}
