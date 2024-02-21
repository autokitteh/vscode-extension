import * as fs from "fs";
import * as path from "path";
import { vsCommands } from "@constants";
import { translate } from "@i18n";
import { mapFilesToContentInBytes, readDirectoryRecursive } from "@utilities";
import { commands } from "vscode";

export const getResources = async (
	projectId: string
): Promise<{ data?: Record<string, Uint8Array>; error?: Error }> => {
	const resourcesDirectoryPath = (await commands.executeCommand(vsCommands.getContext, projectId)) as string;
	if (!resourcesDirectoryPath) {
		const errorMsg = translate().t("projects.resourcesDirectoryMissing");
		return { error: new Error(errorMsg) };
	}

	const stats = fs.statSync(resourcesDirectoryPath);
	if (stats && stats.isFile()) {
		const fileName = path.basename(resourcesDirectoryPath);
		try {
			const fileBuffer = fs.readFileSync(resourcesDirectoryPath);
			const mappedResources = { [fileName]: fileBuffer };
			return { data: mappedResources };
		} catch (error) {
			const errorMsg = translate().t("projects.errorReadingTheFile", { error });

			return { error: new Error(errorMsg) };
		}
	}

	const resources = readDirectoryRecursive(resourcesDirectoryPath);
	const mappedResources = await mapFilesToContentInBytes(resourcesDirectoryPath, resources);
	return { data: mappedResources };
};
