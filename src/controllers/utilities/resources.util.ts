import * as fs from "fs";
import * as path from "path";
import { vsCommands } from "@constants";
import { translate } from "@i18n";
import { mapFilesToContentInBytes, readDirectoryRecursive } from "@utilities";
import { commands } from "vscode";

export const getResources = async (
	projectId: string
): Promise<{ data?: Record<string, Uint8Array>; error?: Error }> => {
	const resourcesPath = (await commands.executeCommand(vsCommands.getContext, projectId)) as string;
	if (!resourcesPath) {
		const errorMsg = translate().t("projects.resourcesDirectoryMissing");
		return { error: new Error(errorMsg) };
	}

	const stats = fs.statSync(resourcesPath);
	if (stats && stats.isFile()) {
		const fileName = path.basename(resourcesPath);
		try {
			const fileBuffer = fs.readFileSync(resourcesPath);
			const mappedResources = { [fileName]: fileBuffer };
			return { data: mappedResources };
		} catch (error) {
			const errorMsg = translate().t("projects.errorReadingTheFile", { error });

			return { error: new Error(errorMsg) };
		}
	}

	const resources = readDirectoryRecursive(resourcesPath);
	const mappedResources = await mapFilesToContentInBytes(resourcesPath, resources);
	return { data: mappedResources };
};
