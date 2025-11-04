import * as fs from "fs";
import * as path from "path";

import { translate } from "@i18n";
import { mapFilesToContentInBytes, readDirectoryRecursive } from "@utilities";

export const getLocalResources = async (
	resourcesPath: string,
	projectId: string
): Promise<{ data?: Record<string, Uint8Array>; error?: Error }> => {
	if (!resourcesPath) {
		const errorMsg = translate().t("projects.resourcesDirectoryMissing");
		return { error: new Error(errorMsg) };
	}

	const stats = fs.statSync(resourcesPath);
	if (!stats) {
		const errorMsg = translate().t("projects.errorReadingResource", { projectId });

		return { error: new Error(errorMsg) };
	}

	if (stats.isFile()) {
		const fileName = path.basename(resourcesPath);
		try {
			const fileBuffer = fs.readFileSync(resourcesPath);
			const mappedResources = { [fileName]: new Uint8Array(fileBuffer) };
			return { data: mappedResources };
		} catch (error) {
			return { error: error as Error };
		}
	}

	try {
		const allFiles = await readDirectoryRecursive(resourcesPath);
		const mappedBuffers = await mapFilesToContentInBytes(resourcesPath, allFiles);
		const mappedResources: Record<string, Uint8Array> = {};
		for (const [key, buffer] of Object.entries(mappedBuffers)) {
			mappedResources[key] = new Uint8Array(buffer);
		}
		return { data: mappedResources };
	} catch (error) {
		return { error: error as Error };
	}
};
