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

export const openFileExplorer = async (directoryPath: string): Promise<void> => {
	const { exec } = require("child_process");
	let command;

	if (process.platform === "darwin") {
		// Escapes spaces for use in shell command
		const escapedPath = directoryPath.replace(/ /g, "\\ ");
		command = `open "${escapedPath}"`; // Opens Finder at the specified path
	} else if (process.platform === "win32") {
		const escapedPath = directoryPath.replace(/\\/g, "\\\\"); // Escapes backslashes for Windows paths
		command = `explorer "${escapedPath}"`; // Opens File Explorer at the specified path
	} else {
		console.log("Unsupported platform for opening file explorer");
		return;
	}

	exec(command, (error: Error) => {
		if (error) {
			console.error(`Error opening file explorer: ${error}`);
			return;
		}
		console.log(`File explorer opened at ${path} successfully`);
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
