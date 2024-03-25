import { buildsClient } from "@api/grpc/clients.grpc.api";
import { namespaces } from "@constants";
import { translate } from "@i18n";
import { LoggerService } from "@services";
import { ServiceResponse } from "@type";

export class BuildsService {
	static async getBuildDescription(buildId: string): Promise<ServiceResponse<{ descriptionJson: string }>> {
		try {
			const buildResponse = await buildsClient.describe({ buildId });
			return { data: buildResponse, error: undefined };
		} catch (error) {
			LoggerService.error(
				namespaces.deploymentsService,
				translate().t("errors.buildInfoFetchFailedForBuild", { error: (error as Error).message, buildId: buildId })
			);
			return { data: undefined, error };
		}
	}
}
