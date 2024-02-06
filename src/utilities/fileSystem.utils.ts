import * as fs from "fs/promises";
import * as path from "path";
import { translate } from "@i18n";

export const createDirectory = async (outputPath: string): Promise<void> => {
	try {
		await fs.mkdir(outputPath, { recursive: true });
	} catch (error) {
		const nodeError = error as NodeJS.ErrnoException;

		if (nodeError.code === "EEXIST") {
			throw new Error(translate().t("errors.creatingDirectoryAlreadyExist", { outputPath }));
		} else if (nodeError.code === "EPERM" || nodeError.code === "EACCES") {
			throw new Error(translate().t("errors.creatingDirectoryPermission", { outputPath }));
		} else {
			throw new Error(translate().t("errors.creatingDirectoryPermission", { outputPath, error: nodeError.message }));
		}
	}
};

export const listFilesInDirectory = async (dirPath: string, includeDirectories: boolean = false): Promise<string[]> => {
	const entries = await fs.readdir(dirPath, { withFileTypes: true });
	const files: string[] = [];

	for (const entry of entries) {
		const entryPath = path.join(dirPath, entry.name);
		if (entry.isDirectory()) {
			if (includeDirectories) {
				files.push(entryPath);
			}
		} else {
			files.push(entryPath);
		}
	}

	return files;
};
