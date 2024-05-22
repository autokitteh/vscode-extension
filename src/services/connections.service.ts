import { connectionsClient, integrationsClient } from "@api/grpc/clients.grpc.api";
import { namespaces } from "@constants";
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
}
