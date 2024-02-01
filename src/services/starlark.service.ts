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
const getLatestRelease = async (): Promise<void | string> => {
	return axios
		.get("https://api.github.com/repos/autokitteh/autokitteh-starlark-lsp/releases")
		.then((data) => {
			return data.data[data.data.length - 1].assets[1].browser_download_url as string;
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
			.pipe(tar.extract({ cwd: outputDir }))
			.on("finish", resolve)
			.on("error", reject);
	});
};

const downloadAndSaveFile = async (url: string, filePath: string): Promise<void> => {
	try {
		await axios
			.get(url, {
				responseType: "stream",
			})
			.then(async function (response) {
				const writer = fs.createWriteStream(filePath);
				writer.on("error", (err) => {
					console.error("Error writing file:", err);
					throw err;
				});

				await response.data.pipe(writer);
			})
			.catch((error) => {
				console.error("Error during HTTP request:", error);
				throw error;
			});
	} catch (error) {
		console.error(error);
	}
};

const downloadExecutable = async (extensionPath: string) => {
	const userResponse = await window.showInformationMessage(
		translate().t("starlark.downloadExecutableDialog"),
		"Yes",
		"No"
	);

	const releaseURL = await getLatestRelease();

	if (userResponse === "Yes") {
		let fileAddress: string;
		let platform = os.platform();
		if (!releaseURL) {
			return;
		}

		switch (platform) {
			case "darwin":
				fileAddress = releaseURL;
				break;
			case "linux":
				fileAddress = "http://example.com/file.deb";
				break;
			case "win32":
				fileAddress = "http://example.com/file.exe";
				break;
			default:
				let error = `${platform} is not supported.`;

				commands.executeCommand(vsCommands.showErrorMessage, namespaces.starlarkLSPExecutable, error);
				LoggerService.error(namespaces.deploymentsService, error);
				return;
		}

		if (extensionPath) {
			const fileName = getFileNameFromUrl(releaseURL);
			await downloadAndSaveFile(fileAddress, `${extensionPath}/${fileName}`);
			await extractTarGz(`${extensionPath}/${fileName}`, `${extensionPath}`);
			workspace.getConfiguration().update("autokitteh.starlarkLSPPath", `${extensionPath}/autokitteh-starlark-lsp`);

			commands.executeCommand(
				vsCommands.showInfoMessage,
				namespaces.startlarkLSPServer,
				translate().t("starlark.executableDownloadedSuccefully")
			);
		}
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
