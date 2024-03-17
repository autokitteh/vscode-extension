import { ListResponse } from "@ak-proto-ts/triggers/v1/svc_pb";
import { triggersClient } from "@api/grpc/clients.grpc.api";
import { namespaces } from "@constants";
import { convertTriggerProtoToModel } from "@models/trigger.model";
import { EnvironmentsService, LoggerService } from "@services";
import { ServiceResponse } from "@type";
import { Trigger, TriggerObj } from "@type/models";
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

	static async listByProjectId(projectId: string): Promise<ServiceResponse<TriggerObj>> {
		const { data: environments, error: environmentsError } = await EnvironmentsService.listByProjectId(projectId);

		if (environmentsError) {
			LoggerService.error(namespaces.triggersService, (environmentsError as Error).message);

			return { data: undefined, error: environmentsError };
		}

		const environmentIds = getIds(environments!, "envId");
		const { data: projectTriggers, error: listTriggersError } = await this.listByEnvironmentIds(environmentIds);

		if (listTriggersError) {
			const log = `Error occured for project id: ${projectId} - ${(listTriggersError as Error).message}`;
			LoggerService.error(namespaces.triggersService, log);

			return { data: undefined, error: log };
		}

		const projectTriggersReduced = projectTriggers!.reduce(
			(allTriggers: Record<string, string[]>, trigger: Trigger) => {
				if (!allTriggers[trigger.path]) {
					allTriggers[trigger.path] = [];
				}
				allTriggers[trigger.path].push(trigger.name);
				return allTriggers;
			},
			{}
		);

		return { data: projectTriggersReduced, error: undefined };
	}
}
