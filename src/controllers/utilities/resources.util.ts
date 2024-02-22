import * as fs from "fs";
import * as path from "path";
import { vsCommands } from "@constants";
import { translate } from "@i18n";
import { mapFilesToContentInBytes, readDirectoryRecursive } from "@utilities";
import { commands } from "vscode";

const getResourcesPath = async (projectId: string) => {
	const { path }: { path: string } = await commands.executeCommand(vsCommands.getContext, projectId);
	return path;
};

export const getResources = async (
	projectId: string
): Promise<{ data?: Record<string, Uint8Array>; error?: Error }> => {
	const resourcesPath = await getResourcesPath(projectId);
	if (!resourcesPath) {
		const errorMsg = translate().t("projects.resourcesDirectoryMissing");
		return { error: new Error(errorMsg) };
	}

	const stats = fs.statSync(resourcesPath);
	if (!stats) {
		const errorMsg = translate().t("projects.errorReadingResource");

		return { error: new Error(errorMsg) };
	}

	if (stats.isFile()) {
		const fileName = path.basename(resourcesPath);
		try {
			const fileBuffer = fs.readFileSync(resourcesPath);
			const mappedResources = { [fileName]: fileBuffer };
			return { data: mappedResources };
		} catch (error) {}
	}
	const mappedResources = stats.isFile()
		? await mapFilesToContentInBytes(resourcesPath, [resourcesPath])
		: await mapFilesToContentInBytes(resourcesPath, readDirectoryRecursive(resourcesPath));

	return { data: mappedResources };
};
