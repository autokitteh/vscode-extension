import { connectionsService } from "@api/grpc/clients.grpc.api";
import { namespaces } from "@constants";
import { translate } from "@i18n";
import { convertConnectionProtoToModel } from "@models";
import { LoggerService } from "@services";
import { ServiceResponse } from "@type";
import { Connection } from "@type/models";

export class ConnectionsService {
	static async list(): Promise<ServiceResponse<Connection[]>> {
		try {
			const connections = await connectionsService.list({});
			const convertedConnections = connections.connections.map(convertConnectionProtoToModel);
			return { data: convertedConnections, error: undefined };
		} catch (error) {
			LoggerService.error(namespaces.deploymentsService, translate().t("errors.connectionsListFetchFailed"));
			return { data: undefined, error };
		}
	}
}
