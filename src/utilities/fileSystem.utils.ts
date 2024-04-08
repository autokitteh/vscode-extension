import * as fs from "fs";
import * as fsPromises from "fs/promises";
import * as path from "path";
import { translate } from "@i18n";
import * as winattr from "winattr";

export const createDirectory = async (outputPath: string): Promise<void> => {
	try {
		// Attempt to get stats first to check if directory already exists
		const stats = await fsPromises.stat(outputPath);

		// If stats do not throw and the path is indeed a directory, throw an already exists error
		if (stats.isDirectory()) {
			throw new Error(translate().t("errors.creatingDirectoryAlreadyExist", { outputPath }));
		} else {
			// Exists but is not a directory, handle this case if needed
			throw new Error(
				translate().t("errors.creatingDirectoryAccess", {
					outputPath,
					error: translate().t("errors.pathExist"),
				})
			);
		}
	} catch (error) {
		const nodeError = error as NodeJS.ErrnoException;

		// If the error code is ENOENT, the directory does not exist, and we can safely create it
		if (nodeError.code === "ENOENT") {
			try {
				await fsPromises.mkdir(outputPath, { recursive: true });
			} catch (mkdirError) {
				// Handle mkdir error, potentially a permission issue
				const mkdirNodeError = mkdirError as NodeJS.ErrnoException;
				throw new Error(
					translate().t("errors.creatingDirectoryPermission", { outputPath, error: mkdirNodeError.message })
				);
			}
		} else {
			// For any other error during stats fetching, throw a generic access error
			throw new Error(translate().t("errors.creatingDirectoryAccess", { outputPath, error: nodeError.message }));
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
