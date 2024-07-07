import { commands, env, Uri } from "vscode";

import { BASE_URL, namespaces, vsCommands } from "@constants";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import { ConnectionsService, LoggerService } from "@services";
import { Connection } from "@type/models";

export class ConnectionsController {
	private projectId: string;
	private connections?: Connection[];
	private view: any;
	private loaderFuncs: { startLoader: () => void; stopLoader: () => void };

	constructor(projectId: string, view: any, loaderFuncs: { startLoader: () => void; stopLoader: () => void }) {
		this.projectId = projectId;
		this.view = view;
		this.loaderFuncs = loaderFuncs;
	}

	async fetchConnections() {
		this.loaderFuncs.startLoader();
		const { data: connections, error } = await ConnectionsService.list(this.projectId);
		this.loaderFuncs.stopLoader();

		if (error) {
			commands.executeCommand(
				vsCommands.showErrorMessage,
				translate().t("errors.fetchingConnectionsFailed", { projectId: this.projectId })
			);
			return;
		}

		this.connections = connections;

		this.view.update({
			type: MessageType.setConnections,
			payload: this.connections,
		});
	}

	async openConnectionInitURL(connectionInit: { connectionName: string; initURL: string }) {
		const connectionInitURL = Uri.parse(`${BASE_URL}${connectionInit.initURL}`);

		const initLinkOpenInBrowser = await env.openExternal(connectionInitURL);

		if (!initLinkOpenInBrowser) {
			const notification = translate().t("errors.failedOpenConnectionInit", {
				projectName: this.view.project?.name,
				connectionName: connectionInit.connectionName,
			});

			const log = translate().t("errors.failedOpenConnectionInitEnriched", {
				projectName: this.view.project?.name,
				connectionName: connectionInit.connectionName,
				connectionURL: connectionInitURL,
			});

			commands.executeCommand(vsCommands.showErrorMessage, notification);
			LoggerService.error(namespaces.connectionsController, log);
		}
	}
}
