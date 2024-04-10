import { exec } from "child_process";
import * as fs from "fs";
import * as fsPromises from "fs/promises";
import * as path from "path";
import { translate } from "@i18n";
import * as winattr from "winattr";

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

export const openFileExplorer = (directoryPath: string) => {
	let command;
	const normalizedPath = path.normalize(directoryPath);
	const quotedPath = `"${normalizedPath}"`;

	if (process.platform === "darwin") {
		command = `open ${quotedPath}`;
	} else if (process.platform === "win32") {
		command = `explorer ${quotedPath}`;
	} else if (process.platform === "linux") {
		command = `xdg-open "${path}"`;
	} else {
		throw new Error(translate().t("errors.notSupportedPlatform"));
	}

	exec(command, (error) => {
		if (error) {
			throw new Error(translate().t("errors.errorOpeningFileExplorer", { error }));
		}
	});
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
			} else if (stats.isFile()) {
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
		const normalizedBasePath = path.normalize(basePath);
		const normalizedFullPath = path.normalize(fullPath);
		const relativePath = path.relative(normalizedBasePath, normalizedFullPath);
		const contentBytes = fs.readFileSync(normalizedFullPath);
		fileContentMap[relativePath] = contentBytes;
	}

	return fileContentMap;
};

export const getDirectoryOfFile = (filePath: string): string => path.dirname(filePath);
