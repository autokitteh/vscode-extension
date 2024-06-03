import { Integration as ProtoIntegration } from "@ak-proto-ts/integrations/v1/integration_pb";
import { Integration } from "@type/models";

export const convertIntegrationProtoToModel = (ProtoIntegration: ProtoIntegration): Integration => {
	return {
		integrationId: ProtoIntegration.integrationId,
		name: ProtoIntegration.displayName,
	};
};
