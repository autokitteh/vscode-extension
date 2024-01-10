import { Env } from "@ak-proto-ts/envs/v1/env_pb";
import { environmentsClient } from "@api/grpc/clients.grpc.api";
import { namespaces } from "@constants";
import { LoggerLevel } from "@enums";
import { LoggerService } from "@services/logger.service";
import { ServiceResponse } from "@type/services.types";

export class EnvironmentsService {
	static async listByProjectId(projectId: string): Promise<ServiceResponse<Env[]>> {
		try {
			const environments = (
				await environmentsClient.list({
					parentId: projectId,
				})
			).envs;
			return { data: environments, error: undefined };
		} catch (error) {
			LoggerService.log(
				namespaces.environmentsService,
				(error as Error).message,
				LoggerLevel.error
			);

			return { data: undefined, error };
		}
	}
}
