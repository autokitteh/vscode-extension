import * as fs from "fs";
import * as fsPromises from "fs/promises";
import * as path from "path";
import { translate } from "@i18n";
import * as winattr from "winattr";
const { isJunk } = require("junk");

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

const isWinHiddenPath = function (path: string) {
	const pathAttrs = winattr.getSync(path);
	return pathAttrs.hidden;
};

export const readDirectoryRecursive = async (directoryPath: string): Promise<string[]> => {
	let files: string[] = [];
	const isWin = process.platform === "win32";

	const readDirSync = (dirPath: string) => {
		fs.readdirSync(dirPath).forEach(async (file) => {
			const fullPath = path.join(dirPath, file);

			if (isWin && isWinHiddenPath(fullPath)) {
				return;
			}

			if (!isWin && isUnixHiddenPath(fullPath)) {
				return;
			}

			const stats = fs.statSync(fullPath);
			if (stats.isDirectory()) {
				files = files.concat(await readDirectoryRecursive(fullPath));
			} else if (stats.isFile() && isJunk(fullPath)) {
				files.push(fullPath);
			}
		});
	};

	readDirSync(directoryPath);
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
