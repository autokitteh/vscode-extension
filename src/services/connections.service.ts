import { connectionsClient, integrationsClient } from "@api/grpc/clients.grpc.api";
import { namespaces } from "@constants";
import { translate } from "@i18n";
import { convertConnectionProtoToModel, mapProtoStatusToConnectionStatus } from "@models";
import { LoggerService } from "@services";
import { ServiceResponse } from "@type";
import { Connection, ConnectionStatus } from "@type/models";

export class ConnectionsService {
	static async list(projectId: string): Promise<ServiceResponse<Connection[]>> {
		try {
			const connections = await connectionsClient.list({ projectId });
			const convertedConnections = connections.connections.map(convertConnectionProtoToModel);

			const integrationsList = await integrationsClient.list({});

			convertedConnections.forEach((connection) => {
				const integration = integrationsList.integrations.find(
					(integration) => integration.integrationId === connection.integrationId
				);
				if (integration) {
					connection.integrationName = integration.displayName;
				}
			});

			return { data: convertedConnections, error: undefined };
		} catch (error) {
			LoggerService.error(
				namespaces.deploymentsService,
				translate().t("errors.connectionsListFetchFailed", { projectId })
			);
			return { data: undefined, error };
		}
	}

	static async getCurrentStatus(connectionId: string): Promise<ServiceResponse<ConnectionStatus>> {
		try {
			await integrationsClient.testConnection({ connectionId });
			const { status } = await connectionsClient.test({ connectionId });

			return {
				data: mapProtoStatusToConnectionStatus(status),
				error: undefined,
			};
		} catch (error) {
			LoggerService.error(namespaces.deploymentsService, translate().t("errors.connectionTestFailed"));
			return { data: undefined, error };
		}
	}
}
