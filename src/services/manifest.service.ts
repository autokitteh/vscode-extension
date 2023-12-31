import { manifestClient } from "@api/grpc/clients.grpc.api";
import { ServiceResponse } from "@type/services.types";

export class ManifestService {
	static async applyManifest(manifestYaml: string): Promise<ServiceResponse<void>> {
		try {
			manifestClient.applyManifest(manifestYaml);
			return { data: undefined, error: undefined };
		} catch (error) {
			return { data: undefined, error };
		}
	}
}
