import { DescribeResponse } from "@ak-proto-ts/builds/v1/svc_pb";
import { buildsClient } from "@api/grpc/clients.grpc.api";
import { namespaces } from "@constants";
import { LoggerService } from "@services";
import { ServiceResponse } from "@type";

export class BuildsService {
	static async getBuildDescription(buildId: string): Promise<ServiceResponse<DescribeResponse>> {
		try {
			const buildResponse = await buildsClient.describe({ buildId });
			return { data: buildResponse, error: undefined };
		} catch (error) {
			LoggerService.error(namespaces.deploymentsService, (error as Error).message);
			return { data: undefined, error };
		}
	}
}
