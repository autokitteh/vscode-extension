import * as fsSync from "fs";
import * as fsPromises from "fs/promises"; // Correct import for promise-based operations
import * as path from "path";

export const ensureDirectoryExists = (outputPath: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		fsSync.access(outputPath, fsSync.constants.F_OK, (err) => {
			if (err) {
				fsSync.mkdir(outputPath, { recursive: true }, (err) => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			} else {
				resolve();
			}
		});
	});
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
