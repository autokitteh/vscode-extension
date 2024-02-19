import * as fs from "fs";
import { namespaces, starlarkLSPUriScheme, starlarkLocalLSPDefaultArgs, vsCommands } from "@constants";
import { translate } from "@i18n/translation.i18n";
import { StarlarkSocketStreamingService, LoggerService, StarlarkVersionManagerService } from "@services";
import { StarlarkFileHandler } from "@starlark";
import { ValidateURL, WorkspaceConfig } from "@utilities";
import { commands, workspace } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient";

export class StarlarkLSPService {
	private static languageClient: LanguageClient | undefined = undefined;

	private static async startLSPServer(
		serverOptions: ServerOptions,
		clientOptions: LanguageClientOptions,
		starlarkLSPVersion: string,
		starlarkLSPPath: string
	) {
		const localStarlarkFileExist = fs.existsSync(starlarkLSPPath);

		if (!localStarlarkFileExist && !ValidateURL(starlarkLSPPath)) {
			LoggerService.error(
				namespaces.startlarkLSPServer,
				translate().t("starlark.executableNotFound", { starlarkLSPPath: starlarkLSPPath })
			);
			return;
		}

		// eslint-disable-next-line max-len
		const lspConfigurationMessage = `(${starlarkLSPVersion}): ${starlarkLSPPath} ${starlarkLocalLSPDefaultArgs.join(", ")}`;
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

	public static async initStarlarkLSP(
		starlarkLSPPath: string,
		starlarkLSPVersion: string,
		extensionPath: string,
		updateContext: (key: string, value: any) => Thenable<void>
	) {
		let clientOptions: LanguageClientOptions = {
			documentSelector: [{ scheme: "file", language: "starlark" }],
			initializationOptions: {},
			outputChannelName: "autokitteh: Starlark LSP Server",
		};

		/* By default, the Starlark LSP operates through a CMD command in stdio mode.
		 * However, if the 'starlarkLSPSocketMode' is enabled, the LSP won't initiate automatically.
		 * Instead, VSCode connects to 'localhost:starlarkLSPPort', expecting the Starlark LSP to be running in socket mode. */
		if (ValidateURL(starlarkLSPPath)) {
			let serverURL = new URL(starlarkLSPPath);

			const port = (serverURL.port && Number(serverURL.port)) as number;
			const host = serverURL.hostname;
			if (!port || !host) {
				return;
			}

			const serverOptions = () => StarlarkSocketStreamingService.getServerOptionsStreamInfo(host, port);
			StarlarkLSPService.startLSPServer(serverOptions as ServerOptions, clientOptions, "socket", starlarkLSPPath);
			return;
		}

		if (StarlarkLSPService.languageClient) {
			StarlarkLSPService.languageClient.stop();
		}

		const executableLSP = await StarlarkVersionManagerService.updateLSPVersionIfNeeded(
			starlarkLSPPath,
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
			updateContext("autokitteh.starlarkLSP", newStarlarkPath);
			updateContext("autokitteh.starlarkVersion", newStarlarkVersion);
			LoggerService.info(
				namespaces.startlarkLSPServer,
				translate().t("starlark.executableDownloadedSuccessfully", { version: newStarlarkVersion })
			);
			commands.executeCommand(
				vsCommands.showInfoMessage,
				translate().t("starlark.executableDownloadedSuccessfully", { version: newStarlarkVersion })
			);
		}

		let serverOptions = {
			command: starlarkLSPPath,
			args: starlarkLocalLSPDefaultArgs,
		};

		StarlarkLSPService.startLSPServer(serverOptions, clientOptions, newStarlarkVersion!, newStarlarkPath!);
	}
}
