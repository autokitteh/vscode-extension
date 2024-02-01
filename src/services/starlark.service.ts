import * as fs from "fs";
import { connect } from "net";
import * as os from "os";
import * as path from "path";
import * as zlib from "zlib";
import { namespaces, vsCommands } from "@constants";
import { starlarkLSPPath, starlarkLSPUriScheme, starlarkLSPArgs } from "@constants";
import { getConfig } from "@constants/utilities";
import { translate } from "@i18n";
import { LoggerService } from "@services/logger.service";
import { StarlarkFileHandler } from "@starlark";
import axios from "axios";
import * as tar from "tar";
import { workspace, commands, ConfigurationChangeEvent, window } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions, StreamInfo } from "vscode-languageclient";

const host = "127.0.0.1";

interface GitHubRelease {
	data: {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		tag_name: string;
		assets: Array<{
			name: string;
			// eslint-disable-next-line @typescript-eslint/naming-convention
			browser_download_url: string;
		}>;
	}[];
}

interface AssetInfo {
	url: string;
	tag: string;
}

const getAssetByPlatform = (data: GitHubRelease, platform: string): AssetInfo | undefined => {
	let enrichedPlatform = "Darwin_arm64";

	if (platform === "darwin") {
		enrichedPlatform = "Darwin_arm64";
	}

	const tagVersion = data.data[data.data.length - 1].tag_name;

	const asset =
		data.data[data.data.length - 1].assets.find((asset) => asset.name.indexOf(enrichedPlatform) !== -1) || undefined;

	if (!asset) {
		return;
	}

	return {
		url: asset.browser_download_url as string,
		tag: tagVersion as string,
	};
};

const getLatestRelease = async (platform: string): Promise<void | { tag: string; url: string }> => {
	return axios
		.get("https://api.github.com/repos/autokitteh/autokitteh-starlark-lsp/releases")
		.then((data) => {
			const asset = getAssetByPlatform(data, platform);

			return asset;
		})
		.catch((error) => {
			commands.executeCommand(vsCommands.showErrorMessage, namespaces.starlarkLSPExecutable, error);
		});
};

const getFileNameFromUrl = (downloadUrl: string): string => {
	const url = new URL(downloadUrl);
	return path.basename(url.pathname);
};

const extractTarGz = (filePath: string, outputDir: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		fs.createReadStream(filePath)
			.pipe(zlib.createGunzip())
			.on("error", reject)
			.pipe(tar.extract({ cwd: outputDir }))
			.on("close", resolve)
			.on("error", reject);
	});
};

const downloadAndSaveFile = async (url: string, filePath: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		axios
			.get(url, { responseType: "stream" })
			.then((response) => {
				const writer = fs.createWriteStream(filePath);
				response.data.pipe(writer);
				let error: Error | null = null;
				writer.on("error", (err) => {
					error = err;
					writer.close();
					reject(err);
				});
				writer.on("close", () => {
					if (!error) {
						resolve();
					}
				});
			})
			.catch((error) => {
				reject(error);
			});
	});
};

const getNewVersion = async (
	extensionPath: string,
	release: void | {
		url: string;
		tag: string;
	}
) => {
	if (!release) {
		return;
	}

	if (extensionPath) {
		const fileName = getFileNameFromUrl(release.url);
		await downloadAndSaveFile(release.url, `${extensionPath}/${fileName}`);
		try {
			await extractTarGz(`${extensionPath}/${fileName}`, `${extensionPath}`);
		} catch (error) {
			commands.executeCommand(vsCommands.showErrorMessage, namespaces.starlarkLSPExecutable, (error as Error).message);
			LoggerService.error(namespaces.deploymentsService, (error as Error).message);
			return;
		}
		workspace.getConfiguration().update("autokitteh.starlarkLSPPath", `${extensionPath}/autokitteh-starlark-lsp`);
		workspace.getConfiguration().update("autokitteh.starlarkLSPVersion", release.tag);

		commands.executeCommand(
			vsCommands.showInfoMessage,
			namespaces.startlarkLSPServer,
			translate().t("starlark.executableDownloadedSuccefully")
		);
		return;
	}
	const error = translate().t("errors.issueGettingLSP");
	commands.executeCommand(vsCommands.showErrorMessage, namespaces.starlarkLSPExecutable, error);
	LoggerService.error(namespaces.deploymentsService, error);
};

const downloadExecutable = async (extensionPath: string) => {
	let platform = os.platform();

	const release = await getLatestRelease(platform);

	const currentLSPVersion = workspace.getConfiguration().get("autokitteh.starlarkLSPVersion");
	if (currentLSPVersion) {
		if (release && currentLSPVersion !== release.tag) {
			await getNewVersion(extensionPath, release);
		}
		return;
	}

	const userResponse = await window.showInformationMessage(
		translate().t("starlark.downloadExecutableDialog"),
		"Yes",
		"No"
	);

	if (userResponse === "Yes") {
		getNewVersion(extensionPath, release);
	}
};

export class StarlarkLSPService {
	private static languageClient: LanguageClient | undefined = undefined;
	private static extensionPath: string;

	public static init(extensionPath: string) {
		if (StarlarkLSPService.languageClient) {
			return;
		}
		this.extensionPath = extensionPath;
		this.initiateLSPServer();
		workspace.onDidChangeConfiguration(this.onChangeConfiguration);
	}

	private static initiateLSPServer() {
		workspace.registerTextDocumentContentProvider(
			starlarkLSPUriScheme,
			new StarlarkFileHandler(StarlarkLSPService.languageClient!)
		);
		if (StarlarkLSPService.languageClient) {
			return;
		}

		const localStarlarkFile = `${this.extensionPath}/starlark`;

		if (!fs.existsSync(localStarlarkFile)) {
			downloadExecutable(this.extensionPath);
			return;
		}

		let serverOptions: ServerOptions | Promise<StreamInfo> = {
			command: starlarkLSPPath,
			args: starlarkLSPArgs,
		};

		let clientOptions: LanguageClientOptions = {
			documentSelector: [{ scheme: "file", language: "starlark" }],
			initializationOptions: {},
		};

		/* By default, the Starlark LSP operates through a CMD command in stdio mode.
		 * However, if the 'starlarkLSPSocketMode' is enabled, the LSP won't initiate automatically.
		 * Instead, VSCode connects to 'localhost:starlarkLSPPort', expecting the Starlark LSP to be running in socket mode. */
		const isLSPSocketMode = workspace.getConfiguration().get("autokitteh.starlarkLSPSocketMode") as boolean;

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
			const socket = connect({ host, port });
			let streamListener: StreamInfo = { writer: socket, reader: socket };

			serverOptions = () => new Promise((resolve) => resolve(streamListener));
		}

		LoggerService.info(
			namespaces.startlarkLSPServer,
			`Starting LSP Server: ${starlarkLSPPath} ${starlarkLSPArgs.join(", ")}`
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

	private static onChangeConfiguration(event: ConfigurationChangeEvent) {
		const settingsChanged =
			event.affectsConfiguration("autokitteh.starlarkLSPType") ||
			event.affectsConfiguration("autokitteh.autokitteh.starlarkLSPArguments");
		if (!settingsChanged) {
			return;
		}

		if (StarlarkLSPService.languageClient) {
			StarlarkLSPService.languageClient.stop();
			StarlarkLSPService.languageClient = undefined;
		}
		StarlarkLSPService.initiateLSPServer();
	}
}
