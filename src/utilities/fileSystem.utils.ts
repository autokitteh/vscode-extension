import * as fs from "fs";
import * as fsPromises from "fs/promises";
import * as path from "path";
import { translate } from "@i18n";

export const createDirectory = async (outputPath: string): Promise<void> => {
	try {
		await fsPromises.mkdir(outputPath, { recursive: true });
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

const isUnixHiddenPath = function (path: string) {
	return /(^|\/)\.[^\/\.]/g.test(path);
};

export const readDirectoryRecursive = (directoryPath: string): string[] => {
	let files: string[] = [];

	fs.readdirSync(directoryPath).forEach((file) => {
		const fullPath = path.join(directoryPath, file);
		if (isUnixHiddenPath(fullPath)) {
			return;
		}
		if (fs.statSync(fullPath).isDirectory()) {
			files = files.concat(readDirectoryRecursive(fullPath));
		} else {
			files.push(fullPath);
		}
	});

	return files;
};

export const mapFilesToContentInBytes = async (
	basePath: string,
	fullPathArray: string[]
): Promise<{ [key: string]: Buffer }> => {
	const fileContentMap: { [key: string]: Buffer } = {};

	for (const fullPath of fullPathArray) {
		const relativePath = path.relative(basePath, fullPath);
		if (!isHiddenFile(fullPath)) {
			fileContentMap[relativePath] = fs.readFileSync(fullPath);
		}
	}

	return fileContentMap;
};

export const getDirectoryOfFile = (filePath: string): string => path.dirname(filePath);
