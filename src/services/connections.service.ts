import { connectionsClient, integrationsClient } from "@api/grpc/clients.grpc.api";
import { namespaces } from "@constants";
import { ConnectionStatus } from "@enums";
import { translate } from "@i18n";
import { convertConnectionProtoToModel } from "@models";
import { LoggerService } from "@services";
import { ServiceResponse } from "@type";
import { Connection } from "@type/models";

export class ConnectionsService {
	static async list(projectId: string): Promise<ServiceResponse<Connection[]>> {
		try {
			const connections = await connectionsClient.list({ projectId });
			const convertedConnections = connections.connections.map(convertConnectionProtoToModel);

			const integrationsList = await integrationsClient.list({});

			convertedConnections.map((connection) => {
				const integration = integrationsList.integrations.find(
					(integration) => integration.integrationId === connection.integrationId
				);
				if (integration) {
					connection.integrationName = integration.displayName;
				}
			});

			return { data: convertedConnections, error: undefined };
		} catch (error) {
			LoggerService.error(namespaces.deploymentsService, translate().t("errors.connectionsListFetchFailed"));
			return { data: undefined, error };
		}
	}

	static async test(
		connectionId: string
	): Promise<ServiceResponse<{ isOK: boolean; currentStatus: ConnectionStatus | undefined }>> {
		try {
			const connectionStatus = await connectionsClient.test({ connectionId });
			if (connectionStatus?.status?.code) {
				const isOK = (connectionStatus.status.code as number) === ConnectionStatus.ok;
				return {
					data: { isOK, currentStatus: connectionStatus.status.code as number },
					error: undefined,
				};
			}
			return { data: { isOK: false, currentStatus: undefined }, error: undefined };
		} catch (error) {
			LoggerService.error(namespaces.deploymentsService, translate().t("errors.connectionTestFailed"));
			return { data: { isOK: false, currentStatus: undefined }, error };
		}
	}
}
