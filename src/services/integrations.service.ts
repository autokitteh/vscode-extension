import { integrationsClient } from "@api/grpc/clients.grpc.api";
import { namespaces } from "@constants";
import { translate } from "@i18n";
import { convertIntegrationProtoToModel } from "@models";
import { LoggerService } from "@services";
import { ServiceResponse } from "@type";
import { Integration } from "@type/models";

export class IntegrationsService {
	static async list(): Promise<ServiceResponse<Integration[]>> {
		try {
			const { integrations } = await integrationsClient.list({});
			const convertedIntegrations = integrations.map(convertIntegrationProtoToModel);

			return { data: convertedIntegrations, error: undefined };
		} catch (error) {
			LoggerService.error(namespaces.deploymentsService, translate().t("errors.integrationsListFetchFailed"));
			return { data: undefined, error };
		}
	}
}
