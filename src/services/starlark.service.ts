import * as fs from "fs";
import { connect } from "net";
import * as os from "os";
import * as path from "path";
import {
	namespaces,
	starlarkLSPLocalhost,
	vsCommands,
	starlarkLSPPath,
	starlarkLSPUriScheme,
	starlarkLSPArgs,
	starlarkExecutableGithubRepository,
	getConfig,
} from "@constants";
import { translate } from "@i18n";
import { Asset, AssetInfo, GitHubRelease } from "@interfaces";
import { LoggerService } from "@services";
import { StarlarkFileHandler } from "@starlark";
import { extractArchive } from "@utilities";
import axios from "axios";
import { workspace, commands, ExtensionContext, window } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions, StreamInfo } from "vscode-languageclient";

export class StarlarkLSPService {
	private static languageClient: LanguageClient | undefined = undefined;
	private static extensionContext: ExtensionContext;

	public static init(extensionContext: ExtensionContext) {
		this.extensionContext = extensionContext;
		this.initiateLSPServer();
	}

	private static async initiateLSPServer() {
		workspace.registerTextDocumentContentProvider(
			starlarkLSPUriScheme,
			new StarlarkFileHandler(StarlarkLSPService.languageClient!)
		);
		if (StarlarkLSPService.languageClient) {
			StarlarkLSPService.languageClient.stop();
		}

		let starlarkPath: string | undefined = starlarkLSPPath(this.extensionContext);
		if (!starlarkPath || !fs.existsSync(starlarkPath)) {
			const platform = os.platform();
			const arch = os.arch();
			const release = await this.getLatestRelease(platform, arch);

			const currentLSPVersion = workspace.getConfiguration().get<string>("autokitteh.starlarkLSPVersion");
			if (release && currentLSPVersion !== release.tag) {
				const userResponse = await window.showInformationMessage(
					translate().t("lsp.downloadExecutableDialog"),
					"Yes",
					"No"
				);
				if (userResponse === "Yes") {
					LoggerService.info(namespaces.startlarkLSPServer, translate().t("lsp.downloadExecutableInProgress"));

					starlarkPath = await this.getNewVersion(this.extensionContext, release);
				}
				return;
			}
			if (!starlarkPath) {
				LoggerService.error(namespaces.startlarkLSPServer, translate().t("errors.starlarLSPInit"));
				return;
			}
		}

		const starlarkLSPArgsFromConfig = starlarkLSPArgs(this.extensionContext);

		let serverOptions: ServerOptions | Promise<StreamInfo> = {
			command: starlarkPath,
			args: starlarkLSPArgsFromConfig,
		};

		let clientOptions: LanguageClientOptions = {
			documentSelector: [{ scheme: "file", language: "starlark" }],
			initializationOptions: {},
			outputChannelName: "autokitteh: Starlark LSP Server",
		};

		/* By default, the Starlark LSP operates through a CMD command in stdio mode.
		 * However, if the 'starlarkLSPSocketMode' is enabled, the LSP won't initiate automatically.
		 * Instead, VSCode connects to 'localhost:starlarkLSPPort', expecting the Starlark LSP to be running in socket mode. */
		const isLSPSocketMode = workspace.getConfiguration().get("autokitteh.starlarkLSPSocketMode");

		if (isLSPSocketMode) {
			const port = getConfig<number>("autokitteh.starlarkLSPPort", 0);
			if (!port) {
				LoggerService.error(namespaces.startlarkLSPServer, translate().t("errors.missingStarlarkLSPPort"));
				commands.executeCommand(
					vsCommands.showErrorMessage,
					namespaces.startlarkLSPServer,
					translate().t("errors.missingStarlarkLSPPort")
				);

				return;
			}
			const socket = connect({ host: starlarkLSPLocalhost, port });
			let streamListener: StreamInfo = { writer: socket, reader: socket };

			serverOptions = () => new Promise((resolve) => resolve(streamListener));
		}

		LoggerService.info(
			namespaces.startlarkLSPServer,
			`Starting LSP Server: ${starlarkPath} ${starlarkLSPArgsFromConfig.join(", ")}`
		);

		StarlarkLSPService.languageClient = new LanguageClient(
			"Starlark",
			"autokitteh: Starlark LSP",
			serverOptions,
			clientOptions
		);

		try {
			StarlarkLSPService.languageClient.start();
		} catch (error) {
			LoggerService.error(namespaces.deploymentsService, (error as Error).message);
		}
	}

	private static getAssetByPlatform = (data: GitHubRelease, platform: string, arch: string): AssetInfo | undefined => {
		const enrichedPlatform = `autokitteh-starlark-lsp_${platform}_${arch}`;
		const latestRelease = data.data[data.data.length - 1];
		const asset: Asset | undefined = latestRelease.assets.find((asset: Asset) => asset.name.includes(enrichedPlatform));

		if (!asset) {
			commands.executeCommand(
				vsCommands.showErrorMessage,
				namespaces.startlarkLSPServer,
				translate().t("errors.starlarkPlatformNotSupported")
			);
			return;
		}

		return {
			url: asset.browser_download_url,
			tag: latestRelease.tag_name,
		};
	};

	private static async getLatestRelease(platform: string, arch: string): Promise<AssetInfo | undefined> {
		try {
			const response = await axios.get(starlarkExecutableGithubRepository);
			return this.getAssetByPlatform(response, platform, arch);
		} catch (error) {
			const errorMessage = translate().t("errors.fetchingReleaseInfo", { error: (error as Error).message });
			LoggerService.error(namespaces.startlarkLSPServer, errorMessage);
			commands.executeCommand(vsCommands.showErrorMessage, errorMessage);
			return undefined;
		}
	}

	private static getFileNameFromUrl(downloadUrl: string): string {
		return path.basename(new URL(downloadUrl).pathname);
	}

	private static async downloadAndSaveFile(url: string, filePath: string): Promise<void> {
		try {
			const response = await axios.get(url, { responseType: "stream" });
			const writer = fs.createWriteStream(filePath);
			response.data.pipe(writer);
			return new Promise((resolve, reject) => {
				writer.on("close", resolve);
				writer.on("error", (err) => {
					writer.close();
					reject(err);
				});
			});
		} catch (error) {
			const errorMessage = translate().t("errors.fetchingReleaseInfo", { error: (error as Error).message });
			LoggerService.error(namespaces.startlarkLSPServer, errorMessage);
			commands.executeCommand(vsCommands.showErrorMessage, errorMessage);
		}
	}

	private static async getNewVersion(
		extensionContext: ExtensionContext,
		release?: AssetInfo
	): Promise<string | undefined> {
		if (!release) {
			return undefined;
		}

		const fileName = this.getFileNameFromUrl(release.url);
		const extensionPath = extensionContext.extensionPath;
		try {
			await this.downloadAndSaveFile(release.url, `${extensionPath}/${fileName}`);
			LoggerService.info(namespaces.startlarkLSPServer, translate().t("lsp.executableDownloadedUnpacking"));

			await new Promise<void>((resolve, reject) => {
				extractArchive(`${extensionPath}/${fileName}`, extensionPath, (error) => {
					if (error) {
						const errorMessage = translate().t("errors.issueExtractLSP", { error: error.message });
						LoggerService.error(namespaces.starlarkLSPExecutable, errorMessage);
						commands.executeCommand(vsCommands.showErrorMessage, namespaces.starlarkLSPExecutable, errorMessage);
						reject(error);
					} else {
						resolve();
					}
				});
			});

			const lspPath = `${extensionPath}/autokitteh-starlark-lsp`;

			if (!fs.existsSync(lspPath)) {
				LoggerService.info(namespaces.startlarkLSPServer, translate().t("errors.errorInstallingLSP"));
				return;
			}

			extensionContext.workspaceState.update("autokitteh.starlarkLSPPath", lspPath);
			extensionContext.workspaceState.update("autokitteh.starlarkLSPVersion", release.tag);

			commands.executeCommand(
				vsCommands.showInfoMessage,
				namespaces.startlarkLSPServer,
				translate().t("lsp.executableDownloadedSuccessfully")
			);
			LoggerService.info(namespaces.startlarkLSPServer, translate().t("lsp.executableDownloadedSuccessfully"));

			return lspPath;
		} catch (error) {
			const errorMessage = translate().t("errors.issueExtractLSP", { error: (error as Error).message });
			LoggerService.error(namespaces.startlarkLSPServer, errorMessage);
			commands.executeCommand(vsCommands.showErrorMessage, namespaces.starlarkLSPExecutable, errorMessage);

			return undefined;
		}
	}
}
