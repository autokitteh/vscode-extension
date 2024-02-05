import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";
import { starlarkLSPExtractedDirectory } from "@constants/starlark.constants";
import { ArchiveCallback } from "@type/utilities";
import { ensureDirectoryExists } from "@utilities";
import AdmZip from "adm-zip";
import tarFs from "tar-fs";

const getArchiveType = (filename: string): string => {
	const ext = path.extname(filename).toLowerCase();
	if (ext === ".gz") {
		return "tar.gz";
	}
	if (ext === ".tar") {
		return "tar";
	}
	if (ext === ".zip") {
		return "zip";
	}
	return "unknown";
};

const extractTarGz = (inputPath: string, outputPath: string, callback: ArchiveCallback): void => {
	const decompressor = zlib.createGunzip();
	const input = fs.createReadStream(inputPath);
	const output = tarFs.extract(outputPath);

	input
		.pipe(decompressor)
		.pipe(output)
		.on("finish", () => {
			callback(undefined);
		})
		.on("error", (error: Error) => {
			callback(error);
		});
};

const extractTar = (inputPath: string, outputPath: string, callback: ArchiveCallback): void => {
	const input = fs.createReadStream(inputPath);
	const output = tarFs.extract(outputPath);

	input
		.pipe(output)
		.on("finish", () => {
			callback(undefined);
		})
		.on("error", (error: Error) => {
			callback(error);
		});
};

const extractZip = (inputPath: string, outputPath: string, callback: ArchiveCallback): void => {
	try {
		const zip = new AdmZip(inputPath);
		zip.extractAllTo(outputPath, true);
		callback(undefined);
	} catch (error) {
		callback(error as Error);
	}
};

export const extractArchive = (inputPath: string, outputPath: string, callback: ArchiveCallback): void => {
	const type = getArchiveType(inputPath);

	const extractPath = `${outputPath}/${starlarkLSPExtractedDirectory}`;

	try {
		ensureDirectoryExists(extractPath);
	} catch (error) {
		callback(new Error((error as Error).message));
	}

	switch (type) {
		case "tar.gz":
			extractTarGz(inputPath, extractPath, callback);
			break;
		case "tar":
			extractTar(inputPath, extractPath, callback);
			break;
		case "zip":
			extractZip(inputPath, extractPath, callback);
			break;
		default:
			callback(new Error(type as string));
	}
};
