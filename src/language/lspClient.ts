import { ChildProcess, spawn } from "child_process";
import net = require("net");
import { commands, Disposable, ExtensionContext, OutputChannel, window, workspace } from "vscode";
import { LanguageClient, LanguageClientOptions, StreamInfo } from "vscode-languageclient/node";
import {
	getArguments,
	getServerPort,
	getStarlarkLSPPath,
	getTrace,
	Port,
} from "../language/config";
import { PlaceholderErrorHandler, TiltfileErrorHandler } from "../language/errorHandlers";

const extensionLang = "starlark";
const extensionName = "Starlark";
const maxRestartCount = 5;
const starlarkUnavailableNotification = "Starlark language server could not be started";
const starlarkUnavailableMessage =
	"Could not find a version of Starlark to use with the Starlarkfile extension. " +
	"Please visit https://docs.starlark.dev/install.html to install Starlark v0.26 or higher. " +
	"Autocomplete will not function without a compatible version of Starlark installed.";

export class StarlarkfileLspClient extends LanguageClient {
	private _usingDebugServer = false;

	public constructor(
		private context: ExtensionContext,
		ch: OutputChannel
	) {
		super(
			extensionLang,
			extensionName,
			() => this.startStarlarkLSPServer(),
			StarlarkfileLspClient.clientOptions(ch)
		);
		this.registerCommands();
		this.installErrorHandler();
	}

	static clientOptions(ch: OutputChannel): LanguageClientOptions {
		return {
			documentSelector: [{ scheme: "file", language: extensionLang }],
			synchronize: {
				// Notify the server about file changes to relevant files contained in the workspace
				fileEvents: workspace.createFileSystemWatcher("**/Starlarkfile"),
			},
			outputChannel: ch,
			traceOutputChannel: ch,
			errorHandler: new PlaceholderErrorHandler(),
		};
	}

	public get usingDebugServer() {
		return this._usingDebugServer;
	}

	public start(): Promise<void> {
		const disp = super.start();
		this.info("Starlarkfile LSP started");
		return disp;
	}

	public registerCommands() {
		this.context.subscriptions.push(
			commands.registerCommand("starlarkfile.restartServer", () => {
				this.info("Restarting server");
				this.restart();
			})
		);
	}

	public async restart(): Promise<void> {
		await this.stop().catch((e) => this.warn(e));
		await this.start();
	}

	private async startStarlarkLSPServer(): Promise<ChildProcess | StreamInfo> {
		const port = await this.checkForDebugLspServer();
		if (port) {
			this.info("Connect to debug server");
			this._usingDebugServer = true;
			this.outputChannel.show(true);
			const socket = net.connect({ host: "127.0.0.1", port });
			return { writer: socket, reader: socket };
		}

		try {
			const starlarkPath = getStarlarkLSPPath();
			const configArgs = getArguments();
			const args = ["start"];
			this.info("Starting child process");
			const trace = getTrace();
			switch (trace) {
				case "verbose":
					args.push("--verbose");
					break;
				case "debug":
					this.outputChannel.show(true);
					args.push("--debug");
					break;
			}
			console.log(starlarkPath, args);

			return spawn(starlarkPath, args);
		} catch (e) {
			this.warn(starlarkUnavailableMessage);
			this.outputChannel.show();
			window.showErrorMessage(starlarkUnavailableNotification);
			throw (e as Error).toString();
		}
	}

	private async checkForDebugLspServer(): Promise<Port> {
		const port = getServerPort();
		if (!port) {
			return null;
		}
		return new Promise((resolve) => {
			const checkListen = () => {
				var server = net.createServer();
				server.on("error", () => resolve(port));
				server.on("listening", () => {
					server.close();
					resolve(null);
				});
				server.listen(port, "127.0.0.1");
			};

			if (this.usingDebugServer) {
				// wait for server to restart
				setTimeout(checkListen, 2500);
			} else {
				checkListen();
			}
		});
	}

	private installErrorHandler() {
		const placeholder = this.clientOptions.errorHandler as PlaceholderErrorHandler;
		placeholder.delegate = new TiltfileErrorHandler(this, maxRestartCount);
	}
}
