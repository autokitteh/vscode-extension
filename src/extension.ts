require("module-alias/register");

import { vsCommands } from "@constants";
import { sidebarControllerRefreshRate } from "@constants/api.constants";
import { SidebarController } from "@controllers";
import { TabsManagerController } from "@controllers";
import { AppStateHandler } from "@controllers/utilities/appStateHandler";
import { MessageHandler, SidebarView } from "@views";
import { applyManifest, buildOnRightClick } from "@vscommands";
import {
	openBaseURLInputDialog,
	openUsernameInputDialog,
	openWalkthrough,
} from "@vscommands/walkthrough";
import {
	commands,
	ExtensionContext,
	Uri,
	CancellationToken,
	ProviderResult,
	TextDocumentContentProvider,
	workspace,
} from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient";

let client: LanguageClient;

/// Get a setting at the path, or throw an error if it's not set.
function requireSetting<T>(path: string): T {
	const ret: T | undefined = workspace.getConfiguration().get(path);
	if (ret === undefined) {
		throw new Error(`Setting "${path}" was not configured`);
	}
	return ret;
}

const STARLARK_FILE_CONTENTS_METHOD = "starlark/fileContents";
const STARLARK_URI_SCHEME = "starlark";

class StarlarkFileContentsParams {
	constructor(public uri: String) {}
}

class StarlarkFileContentsResponse {
	constructor(public contents?: string | null) {}
}

/// Ask the server for the contents of a starlark: file
class StarlarkFileHandler implements TextDocumentContentProvider {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	provideTextDocumentContent(uri: Uri, _token: CancellationToken): ProviderResult<string> {
		if (client === undefined) {
			return null;
		} else {
			return client
				.sendRequest<StarlarkFileContentsResponse>(
					STARLARK_FILE_CONTENTS_METHOD,
					new StarlarkFileContentsParams(uri.toString())
				)
				.then((response: StarlarkFileContentsResponse) => {
					if (response.contents !== undefined && response.contents !== null) {
						return response.contents;
					} else {
						return null;
					}
				});
		}
	}
}

export async function activate(context: ExtensionContext) {
	// Make sure that any starlark: URIs that come back from the LSP
	// are handled, and requested from the LSP.
	workspace.registerTextDocumentContentProvider(STARLARK_URI_SCHEME, new StarlarkFileHandler());

	const path: string = requireSetting("starlark.lspPath");
	const args: [string] = requireSetting("starlark.lspArguments");

	// Otherwise to spawn the server
	let serverOptions: ServerOptions = { command: path, args: args };

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for Starlark documents
		documentSelector: [{ scheme: "file", language: "starlark" }],
		initializationOptions: {},
	};

	// Create the language client and start the client.
	client = new LanguageClient("Starlark", "Starlark language server", serverOptions, clientOptions);

	// Start the client. This will also launch the server
	client.start();

	const sidebarView = new SidebarView();

	const sidebarController = new SidebarController(sidebarView, sidebarControllerRefreshRate);
	const tabsManager = new TabsManagerController(context);

	commands.registerCommand(vsCommands.connect, async () => {
		await AppStateHandler.set(true);
		sidebarController.connect();
	});
	commands.registerCommand(vsCommands.disconnect, async () => {
		await AppStateHandler.set(false);
		sidebarController.disconnect();
	});

	context.subscriptions.push(
		commands.registerCommand(vsCommands.openWebview, async (project: SidebarTreeItem) => {
			if (project) {
				tabsManager.openWebview(project);
			}
		})
	);

	context.subscriptions.push(commands.registerCommand(vsCommands.applyManifest, applyManifest));
	context.subscriptions.push(commands.registerCommand(vsCommands.buildFolder, buildOnRightClick));
	context.subscriptions.push(
		commands.registerCommand(vsCommands.openUsernameInputDialog, openUsernameInputDialog)
	);
	context.subscriptions.push(commands.registerCommand(vsCommands.usernameUpdated, function () {}));
	context.subscriptions.push(
		commands.registerCommand(vsCommands.showInfoMessage, MessageHandler.infoMessage)
	);
	context.subscriptions.push(
		commands.registerCommand(vsCommands.showErrorMessage, MessageHandler.errorMessage)
	);
	context.subscriptions.push(
		commands.registerCommand(vsCommands.openBaseURLInputDialog, openBaseURLInputDialog)
	);
	context.subscriptions.push(
		commands.registerCommand(vsCommands.openConfigSetupWalkthrough, openWalkthrough)
	);

	const isAppOn = await AppStateHandler.get();

	if (isAppOn) {
		commands.executeCommand(vsCommands.connect);
	}
}
