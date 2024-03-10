import { ListResponse } from "@ak-proto-ts/triggers/v1/svc_pb";
import { triggersClient } from "@api/grpc/clients.grpc.api";
import { namespaces } from "@constants";
import { convertTriggerProtoToModel } from "@models/trigger.model";
import { EnvironmentsService, LoggerService } from "@services";
import { ServiceResponse } from "@type";
import { Trigger } from "@type/models/trigger.type";
import { flattenArray, getIds } from "@utilities";
import { get } from "lodash";

export class TriggersService {
	static async listByEnvironmentIds(environmentsIds: string[]): Promise<ServiceResponse<Trigger[]>> {
		try {
			const triggersPromises = environmentsIds.map(
				async (envId) =>
					await triggersClient.list({
						envId,
					})
			);

			const triggersResponses = await Promise.allSettled(triggersPromises);
			const triggersSettled = flattenArray<Trigger>(
				triggersResponses
					.filter((response): response is PromiseFulfilledResult<ListResponse> => response.status === "fulfilled")
					.map((response) => get(response, "value.triggers", []).map(convertTriggerProtoToModel))
			);

			const unsettledResponses = triggersResponses
				.filter((response): response is PromiseRejectedResult => response.status === "rejected")
				.map((response) => response.reason);

			return {
				data: triggersSettled,
				error: unsettledResponses.length > 0 ? unsettledResponses : undefined,
			};
		} catch (error) {
			LoggerService.error(namespaces.triggersService, (error as Error).message);

			return { data: undefined, error };
		}
	}

	static async listByProjectId(projectId: string): Promise<ServiceResponse<Trigger[]>> {
		const { data: environments, error: environmentsError } = await EnvironmentsService.listByProjectId(projectId);

		if (environmentsError) {
			LoggerService.error(namespaces.triggersService, (environmentsError as Error).message);

			return { data: undefined, error: environmentsError };
		}

		const environmentIds = getIds(environments!, "envId");
		const { data: projectTriggers, error: deploymentsError } = await this.listByEnvironmentIds(environmentIds);

		if (deploymentsError) {
			LoggerService.error(namespaces.triggersService, (deploymentsError as Error).message);

			return { data: undefined, error: deploymentsError };
		}

		return { data: projectTriggers!, error: undefined };
	}
}
