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
import { starlarkLSPExtractedDirectory } from "@constants/starlark.constants";
import { translate } from "@i18n";
import { Asset, AssetInfo, GitHubRelease } from "@interfaces";
import { LoggerService } from "@services";
import { StarlarkFileHandler } from "@starlark";
import { extractArchive, isTypeOrInterface, listFilesInDirectory } from "@utilities";
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
		if (StarlarkLSPService.languageClient) {
			StarlarkLSPService.languageClient.stop();
		}

		let starlarkPath: string | undefined = starlarkLSPPath(this.extensionContext);

		const platform = os.platform();
		const arch = os.arch();

		let release;
		try {
			release = await this.getLatestRelease(platform, arch);
		} catch (error) {
			LoggerService.error(namespaces.startlarkLSPServer, (error as Error).message);
			commands.executeCommand(vsCommands.showErrorMessage, (error as Error).message);
		}

		if (release && isTypeOrInterface<AssetInfo>(release, "url")) {
			let userResponse: string | undefined;
			const currentLSPVersion = this.extensionContext.workspaceState.get<string>("autokitteh.starlarkLSPVersion");
			const localStarlarkFileExist = starlarkPath && fs.existsSync(starlarkPath);
			if (currentLSPVersion !== release.tag || !localStarlarkFileExist) {
				if (!localStarlarkFileExist) {
					userResponse = await window.showInformationMessage(
						translate().t("lsp.downloadExecutableDialog"),
						translate().t("lsp.downloadExecutableDialogApprove"),
						translate().t("lsp.downloadExecutableDialogDismiss")
					);
				} else {
					userResponse = await window.showInformationMessage(
						translate().t("lsp.updateExecutableDialog"),
						translate().t("lsp.downloadExecutableDialogApprove"),
						translate().t("lsp.downloadExecutableDialogDismiss")
					);
				}
				if (userResponse === translate().t("lsp.downloadExecutableDialogApprove")) {
					LoggerService.info(namespaces.startlarkLSPServer, translate().t("lsp.downloadExecutableInProgress"));

					const fileName = this.getFileNameFromUrl(release.url);
					const extensionPath = this.extensionContext.extensionPath;
					try {
						await this.downloadAndSaveFile(release.url, `${extensionPath}/${fileName}`);
					} catch (downloadError) {
						const errorMessage = translate().t("errors.fetchingReleaseInfo", {
							error: (downloadError as Error).message,
						});

						LoggerService.error(namespaces.startlarkLSPServer, errorMessage);
						commands.executeCommand(vsCommands.showErrorMessage, errorMessage);
						return;
					}

					try {
						LoggerService.info(namespaces.startlarkLSPServer, translate().t("lsp.executableDownloadedUnpacking"));

						// Use the async/await pattern to call extractArchive
						await extractArchive(`${extensionPath}/${fileName}`, extensionPath);

						// If the function completes without throwing an error, extraction was successful
					} catch (extractError) {
						// Handle errors thrown by extractArchive
						const errorMessage = translate().t("errors.issueExtractLSP", { error: (extractError as Error).message });
						LoggerService.error(namespaces.starlarkLSPExecutable, errorMessage);
						commands.executeCommand(vsCommands.showErrorMessage, errorMessage);
						return;
					}

					const filesInLSPDirectory = await listFilesInDirectory(`${extensionPath}/${starlarkLSPExtractedDirectory}`);

					if (filesInLSPDirectory.length !== 1) {
						const errorMessage = translate().t("errors.errors.corruptedLSPArchive");
						LoggerService.error(namespaces.starlarkLSPExecutable, errorMessage);
						commands.executeCommand(vsCommands.showErrorMessage, namespaces.starlarkLSPExecutable, errorMessage);
						return;
					}

					const lspPath = filesInLSPDirectory[0];

					this.extensionContext.workspaceState.update("autokitteh.starlarkLSPPath", lspPath);
					this.extensionContext.workspaceState.update("autokitteh.starlarkLSPVersion", release.tag);

					commands.executeCommand(
						vsCommands.showInfoMessage,
						namespaces.startlarkLSPServer,
						translate().t("lsp.executableDownloadedSuccessfully")
					);
					LoggerService.info(namespaces.startlarkLSPServer, translate().t("lsp.executableDownloadedSuccessfully"));

					starlarkPath = lspPath;
				}
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

			workspace.registerTextDocumentContentProvider(
				starlarkLSPUriScheme,
				new StarlarkFileHandler(StarlarkLSPService.languageClient)
			);
		} catch (error) {
			LoggerService.error(namespaces.deploymentsService, (error as Error).message);
		}
	}

	private static getAssetByPlatform = (data: GitHubRelease, platform: string, arch: string): AssetInfo => {
		const enrichedPlatform = `autokitteh-starlark-lsp_${platform}_${arch}`;
		const latestRelease = data.data[data.data.length - 1];
		const asset: Asset | undefined = latestRelease.assets.find((asset: Asset) => asset.name.includes(enrichedPlatform));

		if (!asset) {
			throw new Error(translate().t("errors.starlarkPlatformNotSupported"));
		}

		return {
			url: asset.browser_download_url,
			tag: latestRelease.tag_name,
		};
	};

	private static async getLatestRelease(platform: string, arch: string): Promise<AssetInfo> {
		try {
			const response = await axios.get(starlarkExecutableGithubRepository);
			return this.getAssetByPlatform(response, platform, arch);
		} catch (error) {
			const errorMessage = translate().t("errors.fetchingReleaseInfo", { error: (error as Error).message });
			throw new Error(errorMessage);
		}
	}

	private static getFileNameFromUrl(downloadUrl: string): string {
		return path.basename(new URL(downloadUrl).pathname);
	}

	private static async downloadAndSaveFile(url: string, filePath: string): Promise<void> {
		const response = await axios.get(url, { responseType: "stream" });
		const writer = fs.createWriteStream(filePath);
		response.data.pipe(writer);
		await new Promise((resolve, reject) => {
			writer.on("close", resolve);
			writer.on("error", (err) => {
				writer.close();
				reject(err);
			});
		});
		return undefined;
	}
}
