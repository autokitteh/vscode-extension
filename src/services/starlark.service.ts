import * as fs from "fs";
import { connect } from "net";
import * as os from "os";
import * as path from "path";
import { namespaces, vsCommands, starlarkLSPUriScheme, starlarkExecutableGithubRepository } from "@constants";
import { starlarkLSPExtractedDirectory } from "@constants/starlark.constants";
import { translate } from "@i18n";
import { Asset, AssetInfo, GitHubRelease } from "@interfaces";
import { LoggerService } from "@services";
import { StarlarkFileHandler } from "@starlark";
import { ValidateURL, extractArchive, isTypeOrInterface, listFilesInDirectory, setConfig } from "@utilities";
import axios from "axios";
import { workspace, commands, window } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions, StreamInfo } from "vscode-languageclient";

export class StarlarkLSPService {
	private static languageClient: LanguageClient | undefined = undefined;
	private static updateWorkspace: (key: string, value: any) => Thenable<void>;

	public static async initiateLSPServer(
		starlarkPath: string,
		starlarkLSPArgs: string[],
		starlarkLSPVersion: string,
		extensionPath: string,
		updateWorkspaceState: (key: string, value: any) => Thenable<void>
	) {
		this.updateWorkspace = updateWorkspaceState;

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
		if (ValidateURL(starlarkPath)) {
			this.initNetworkLSP(starlarkPath, starlarkLSPArgs, clientOptions);
			return;
		}
		this.initLocalLSP(starlarkPath, starlarkLSPArgs, clientOptions, starlarkLSPVersion, extensionPath);
	}

	private static async initLocalLSP(
		starlarkPath: string,
		starlarkLSPArgs: string[],
		clientOptions: LanguageClientOptions,
		starlarkLSPVersion: string,
		extensionPath: string
	) {
		let executableLSP;
		try {
			executableLSP = await this.checkAndUpdateStarlarkLSPVersion(starlarkPath, starlarkLSPVersion, extensionPath);
		} catch (error) {
			LoggerService.error(namespaces.startlarkLSPServer, (error as Error).message);
			commands.executeCommand(vsCommands.showErrorMessage, (error as Error).message);
			return;
		}

		const { path: newStarlarkPath, version: newStarlarkVersion } = executableLSP!;
		if (starlarkPath !== newStarlarkPath) {
			setConfig("autokitteh.LSPPath", newStarlarkPath);
		}
		if (newStarlarkVersion !== undefined) {
			this.updateWorkspace("autokitteh.starlarkLSPVersion", newStarlarkVersion);
		}

		let serverOptions = {
			command: newStarlarkPath,
			args: starlarkLSPArgs,
		};

		this.startLSPServer(serverOptions, clientOptions, starlarkPath, starlarkLSPArgs);
	}

	private static startLSPServer(
		serverOptions: ServerOptions,
		clientOptions: LanguageClientOptions,
		starlarkPath: string,
		starlarkLSPArgs: string[]
	) {
		LoggerService.info(
			namespaces.startlarkLSPServer,
			`Starting LSP Server: ${starlarkPath} ${starlarkLSPArgs.join(", ")}`
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
			LoggerService.error(namespaces.startlarkLSPServer, (error as Error).message);
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

	private static async initNetworkLSP(
		starlarkPath: string,
		starlarkLSPArgs: string[],
		clientOptions: LanguageClientOptions
	): Promise<void> {
		let serverMode = new URL(starlarkPath);

		const port = serverMode.port && Number(serverMode.port);
		const host = serverMode.hostname;
		if (!port) {
			LoggerService.error(namespaces.startlarkLSPServer, translate().t("errors.missingStarlarkLSPPort"));
			commands.executeCommand(
				vsCommands.showErrorMessage,
				namespaces.startlarkLSPServer,
				translate().t("errors.missingStarlarkLSPPort")
			);

			return;
		}
		const socket = connect({ host, port });
		let streamListener: StreamInfo = { writer: socket, reader: socket };

		let serverOptions = () => new Promise((resolve) => resolve(streamListener)) as Promise<StreamInfo>;
		this.startLSPServer(serverOptions, clientOptions, starlarkPath, starlarkLSPArgs);
	}

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

	private static async downloadFile(url: string, filePath: string): Promise<void> {
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
		return;
	}

	private static async downloadAndExtractFile(
		release: AssetInfo,
		extensionPath: string,
		fileName: string
	): Promise<string | undefined> {
		try {
			await this.downloadFile(release.url, `${extensionPath}/${fileName}`);
		} catch (downloadError) {
			const errorMessage = translate().t("errors.fetchingReleaseInfo", {
				error: (downloadError as Error).message,
			});
			throw new Error(errorMessage);
		}

		try {
			LoggerService.info(namespaces.startlarkLSPServer, translate().t("lsp.executableDownloadedUnpacking"));

			await extractArchive(`${extensionPath}/${fileName}`, extensionPath);
		} catch (extractError) {
			const errorMessage = translate().t("errors.issueExtractLSP", { error: (extractError as Error).message });
			throw new Error(errorMessage);
		}

		const filesInLSPDirectory = await listFilesInDirectory(`${extensionPath}/${starlarkLSPExtractedDirectory}`);

		if (filesInLSPDirectory.length !== 1) {
			const errorMessage = translate().t("errors.errors.corruptedLSPArchive");
			throw new Error(errorMessage);
		}

		return filesInLSPDirectory[0];
	}

	private static async checkAndUpdateStarlarkLSPVersion(
		starlarkPath: string,
		starlarkLSPVersion: string,
		extensionPath: string
	): Promise<{ path: string; version?: string } | undefined> {
		const platform = os.platform();
		const arch = os.arch();
		let resultStarlarkPath = starlarkPath;

		let release;
		try {
			release = await this.getLatestRelease(platform, arch);
		} catch (error) {
			throw new Error((error as Error).message);
		}

		if (isTypeOrInterface<AssetInfo>(release, "url")) {
			let userResponse: string | undefined;
			const localStarlarkFileExist = fs.existsSync(starlarkPath);
			if (starlarkLSPVersion !== release.tag || !localStarlarkFileExist) {
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

					let resultStarlarkPath;

					try {
						resultStarlarkPath = await this.downloadAndExtractFile(release, extensionPath, fileName);
					} catch (error) {
						throw new Error((error as Error).message);
					}

					commands.executeCommand(
						vsCommands.showInfoMessage,
						namespaces.startlarkLSPServer,
						translate().t("lsp.executableDownloadedSuccessfully")
					);
					LoggerService.info(namespaces.startlarkLSPServer, translate().t("lsp.executableDownloadedSuccessfully"));

					return { path: resultStarlarkPath!, version: release.tag };
				}
				return { path: resultStarlarkPath, version: undefined };
			}
			return { path: resultStarlarkPath, version: undefined };
		} else {
			const errorMessage = translate().t("errors.couldNotFetchLSP");
			throw new Error(errorMessage);
		}
	}
}
