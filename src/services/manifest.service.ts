import { manifestApplyClient } from "@api/grpc/clients.grpc.api";
import { ServiceResponse } from "@type/services.types";

export class ManifestService {
	static async applyManifest(manifestYaml: string): Promise<ServiceResponse<string[]>> {
		try {
			const { logs } = await manifestApplyClient.apply({ manifest: manifestYaml });
			return { data: logs, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}
}
