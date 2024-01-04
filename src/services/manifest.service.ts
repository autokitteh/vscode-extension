import { manifestApplyClient } from "@api/grpc/clients.grpc.api";
import { ServiceResponse } from "@type/services.types";

export class ManifestService {
	static async applyManifest(
		manifestYaml: string,
		path: string
	): Promise<ServiceResponse<string[]>> {
		try {
			const { logs } = await manifestApplyClient.apply({ manifest: manifestYaml, path });
			return { data: logs, error: undefined };
		} catch (error: unknown) {
			return { data: undefined, error };
		}
	}
}
