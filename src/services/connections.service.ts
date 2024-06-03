import { connectionsClient } from "@api/grpc/clients.grpc.api";
import { namespaces } from "@constants";
import { translate } from "@i18n";
import { convertConnectionProtoToModel } from "@models";
import { IntegrationsService, LoggerService } from "@services";
import { ServiceResponse } from "@type";
import { Connection } from "@type/models";

export class ConnectionsService {
	static async list(projectId: string): Promise<ServiceResponse<Connection[]>> {
		let connections;
		try {
			connections = (await connectionsClient.list({ projectId })).connections.map(convertConnectionProtoToModel);
		} catch (error) {
			LoggerService.error(
				namespaces.deploymentsService,
				translate().t("errors.connectionsListFetchFailed", { projectId })
			);
			return { data: undefined, error };
		}
		const { data: integrations } = await IntegrationsService.list();

		connections.forEach((connection) => {
			const integration = integrations?.find((integration) => integration.integrationId === connection.integrationId);
			if (!integration) {
				LoggerService.error(
					namespaces.deploymentsService,
					translate().t("errors.integrationsMatchIntegrationNameFailed", { projectId })
				);
				return;
			}
			connection.integrationName = integration.name;
		});

		return { data: connections, error: undefined };
	}
}
