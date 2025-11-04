import spawn from "cross-spawn";
import fg from "fast-glob";
import * as fs from "fs";
import * as fsPromises from "fs/promises";
import * as path from "path";

import { translate } from "@i18n";

export const createDirectory = async (outputPath: string): Promise<void> => {
	try {
		const stats = await fsPromises.stat(outputPath);

		if (stats.isDirectory()) {
			throw new Error(translate().t("errors.creatingDirectoryAlreadyExist", { outputPath }));
		}
		throw new Error(
			translate().t("errors.creatingDirectoryAccess", {
				outputPath,
				error: translate().t("errors.pathExist"),
			})
		);
	} catch (error) {
		const nodeError = error as NodeJS.ErrnoException;

		if (nodeError.code === "ENOENT") {
			try {
				await fsPromises.mkdir(outputPath, { recursive: true });
			} catch (mkdirError) {
				const mkdirNodeError = mkdirError as NodeJS.ErrnoException;
				throw new Error(translate().t("errors.creatingDirectoryPermission", { error: mkdirNodeError.message }));
			}
			return;
		}
		throw new Error(translate().t("errors.creatingDirectoryAccess", { error: nodeError.message }));
	}
};

export const openFileExplorer = (directoryPath: string): void => {
	const normalizedPath = path.normalize(directoryPath);
	let command;

	switch (process.platform) {
		case "darwin":
			command = "open";
			break;
		case "win32":
			command = "explorer";
			break;
		case "linux":
			command = "xdg-open";
			break;
		default:
			throw new Error(translate().t("errors.notSupportedPlatform"));
	}

	if (!command) {
		throw new Error(translate().t("errors.notSupportedPlatform"));
	}
	spawn.sync(command, [normalizedPath], { stdio: "inherit" });
};

export const directoryExists = async (directoryPath: string): Promise<boolean> => {
	try {
		const stat = await fs.promises.stat(directoryPath);
		return stat.isDirectory();
	} catch (error) {
		return false;
	}
};

export const listFilesInDirectory = async (dirPath: string, includeDirectories: boolean = false): Promise<string[]> => {
	const entries = await fsPromises.readdir(dirPath, { withFileTypes: true });
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

export const readDirectoryRecursive = async (directoryPath: string): Promise<string[]> => {
	const files = await fg("**/*", {
		cwd: directoryPath,
		absolute: true,
		dot: false,
		onlyFiles: true,
	});

	return files;
};

export const mapFilesToContentInBytes = async (
	basePath: string,
	fullPathArray: string[]
): Promise<{ [key: string]: Buffer }> => {
	const fileContentMap: { [key: string]: Buffer } = {};

	for (const fullPath of fullPathArray) {
		const normalizedBasePath = path.normalize(basePath);
		const normalizedFullPath = path.normalize(fullPath);
		const relativePath = path.relative(normalizedBasePath, normalizedFullPath);
		const contentBytes = fs.readFileSync(normalizedFullPath);
		fileContentMap[relativePath] = contentBytes;
	}

	return fileContentMap;
};

export const getDirectoryOfFile = (filePath: string): string => path.dirname(filePath);
