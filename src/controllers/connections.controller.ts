// ConnectionsController.ts
import { BASE_URL, namespaces, vsCommands } from "@constants";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import { ConnectionsService, LoggerService } from "@services";
import { Connection } from "@type/models";
import { commands, env, Uri } from "vscode";

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
		const { data: connections, error: connectionsError } = await ConnectionsService.list(this.projectId);
		this.loaderFuncs.stopLoader();

		if (connectionsError) {
			commands.executeCommand(vsCommands.showErrorMessage, translate().t("errors.fetchingConnectionsFailed"));
		}

		this.connections = connections;

		this.view.update({
			type: MessageType.setConnections,
			payload: this.connections,
		});
	}

	openConnectionInitURL(connectionInit: { connectionId: string; initURL: string }) {
		const connectionInitURL = Uri.parse(`${BASE_URL}${connectionInit.initURL}`);
		if (!connectionInitURL) {
			const errorMessage = translate().t("errors.connectionInitURLInvalid", {
				projectName: this.view.project?.name,
				url: connectionInitURL,
			});

			commands.executeCommand(vsCommands.showErrorMessage, errorMessage);
			LoggerService.error(namespaces.connectionsController, errorMessage);
		}
		const connection = this.connections?.find((connection) => connection.connectionId === connectionInit.connectionId);

		env.openExternal(connectionInitURL).then((success) => {
			if (!success) {
				const notification = translate().t("errors.failedOpenConnectionInit", {
					projectName: this.view.project?.name,
					connectionName: connection?.name,
				});

				const log = translate().t("errors.failedOpenConnectionInitEnriched", {
					projectName: this.view.project?.name,
					connectionName: connection?.name,
					connectionURL: connectionInitURL,
				});

				commands.executeCommand(vsCommands.showErrorMessage, notification);
				LoggerService.error(namespaces.connectionsController, log);
			}
		});
	}
}
