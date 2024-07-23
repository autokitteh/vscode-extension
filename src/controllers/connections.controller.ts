import { commands, env, Uri } from "vscode";

import { BASE_URL, namespaces, vsCommands } from "@constants";
import { MessageType } from "@enums";
import eventEmitter from "@eventEmitter";
import { translate } from "@i18n";
import { ConnectionsService, IntegrationsService, LoggerService } from "@services";
import { Connection, Integration } from "@type/models";

export class ConnectionsController {
	private projectId: string;
	private connections?: Connection[];
	private view: any;
	private loaderFuncs: { startLoader: () => void; stopLoader: () => void };
	private integrations?: Integration[];
	private connectionsIdsPendingInitCallback: string[] = [];

	constructor(projectId: string, view: any, loaderFuncs: { startLoader: () => void; stopLoader: () => void }) {
		this.projectId = projectId;
		this.view = view;
		this.loaderFuncs = loaderFuncs;
		this.fetchIntegrations();
	}

	async fetchIntegrations() {
		const { data: integrations } = await IntegrationsService.list();
		this.integrations = integrations;
	}

	async fetchConnections() {
		this.loaderFuncs.startLoader();
		const { data: connections, error } = await ConnectionsService.list(this.projectId, this.integrations);
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

	async openConnectionInitURL(connectionInit: { connectionName: string; initURL: string; connectionId: string }) {
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

		this.connectionsIdsPendingInitCallback.push(connectionInit.connectionId);

		eventEmitter.on(`connection.${connectionInit.connectionId}.updated`, () => {
			this.updateConnectionStatus(connectionInit.connectionId);
			eventEmitter.removeListener(`connection.${connectionInit.connectionId}.updated`);
			LoggerService.info(
				namespaces.connectionsController,
				translate().t("connections.connectionInitStarted", { connectionId: connectionInit.connectionId })
			);
			this.connectionsIdsPendingInitCallback = this.connectionsIdsPendingInitCallback.filter(
				(connectionId) => connectionId !== connectionInit.connectionId
			);
		});
	}

	async updateConnectionStatus(connectionId: string) {
		const { data: connection, error } = await ConnectionsService.get(connectionId, this.integrations);

		const log = translate().t("errors.connectionNotFound", { id: connectionId });

		if (error) {
			LoggerService.error(namespaces.connectionsController, (error as Error).message);
			commands.executeCommand(vsCommands.showErrorMessage, log);
			return;
		}

		if (!connection) {
			return;
		}

		if (!this.connections) {
			return;
		}

		const index = this.connections.findIndex((c) => c.connectionId === connection.connectionId);

		if (index === -1) {
			const errorMessage = translate().t("errors.connectionNotInProject", { id: connection.connectionId });
			LoggerService.error(namespaces.connectionsController, errorMessage);
			commands.executeCommand(vsCommands.showErrorMessage, errorMessage);
			return;
		}

		this.connections = [...this.connections.slice(0, index), connection, ...this.connections.slice(index + 1)];

		this.view.update({
			type: MessageType.setConnections,
			payload: this.connections,
		});

		LoggerService.info(
			namespaces.connectionsController,
			translate().t("connections.connectionInitCompleted", { connectionId })
		);
	}

	dispose() {
		this.connectionsIdsPendingInitCallback.forEach((connectionId) => {
			eventEmitter.removeListener(`connection.${connectionId}.updated`);
		});
	}
}
