import { connectionsClient } from "@api/grpc/clients.grpc.api";
import { namespaces } from "@constants";
import { translate } from "@i18n";
import { convertConnectionProtoToModel } from "@models";
import { LoggerService } from "@services";
import { ServiceResponse } from "@type";
import { Connection, Integration } from "@type/models";

export class ConnectionsService {
	static async list(projectId: string, integrations?: Integration[]): Promise<ServiceResponse<Connection[]>> {
		let connections;
		try {
			const connectionsList = await connectionsClient.list({ projectId });
			connections = connectionsList.connections.map(convertConnectionProtoToModel);
		} catch (error) {
			LoggerService.error(
				namespaces.deploymentsService,
				translate().t("errors.connectionsListFetchFailed", { projectId })
			);
			return { data: undefined, error };
		}

		connections.forEach((connection) => {
			const integration = integrations?.find((integration) => integration.integrationId === connection.integrationId);
			if (!integration) {
				LoggerService.error(
					namespaces.deploymentsService,
					translate().t("errors.integrationsMatchIntegrationNameFailedEnriched", { projectId })
				);
				return;
			}
			connection.integrationName = integration.name;
		});

		return { data: connections, error: undefined };
	}
	static async get(connectionId: string, integrations?: Integration[]): Promise<ServiceResponse<Connection>> {
		let connectionResponse: Connection;
		try {
			const { connection } = await connectionsClient.get({ connectionId });
			if (!connection || Object.keys(connection).length === 0) {
				const errorMessage = translate().t("errors.connectionFetchFailed", { id: connectionId });
				LoggerService.error(namespaces.deploymentsService, errorMessage);
				return { data: undefined, error: errorMessage };
			}

			connectionResponse = convertConnectionProtoToModel(connection);
		} catch (error) {
			const errorMessage = translate().t("errors.connectionFetchFailed", { id: connectionId });
			LoggerService.error(namespaces.deploymentsService, errorMessage);
			return { data: undefined, error: errorMessage };
		}

		const integration = integrations?.find(
			(integration) => integration.integrationId === connectionResponse.integrationId
		);
		if (!integration) {
			const errorMessage = translate().t("errors.integrationsMatchIntegrationNameFailed");
			LoggerService.error(namespaces.deploymentsService, errorMessage);
			return { data: undefined, error: errorMessage };
		}

		connectionResponse.integrationName = integration.name;

		return { data: connectionResponse, error: undefined };
	}
}
