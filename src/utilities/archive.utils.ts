import { createReadStream } from "fs";
import * as path from "path";
import { pipeline } from "stream/promises";
import * as zlib from "zlib";
import { starlarkLSPExtractedDirectory } from "@constants/starlark.constants";
import { createDirectory, directoryExists } from "@utilities";
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

const extractTarGz = async (inputPath: string, outputPath: string): Promise<void> => {
	const decompressor = zlib.createGunzip();
	const input = createReadStream(inputPath);
	const output = tarFs.extract(outputPath);
	await pipeline(input, decompressor, output);
};

const extractTar = async (inputPath: string, outputPath: string): Promise<void> => {
	const input = createReadStream(inputPath);
	const output = tarFs.extract(outputPath);
	await pipeline(input, output);
};

const extractZip = async (inputPath: string, outputPath: string): Promise<void> => {
	const zip = new AdmZip(inputPath);
	zip.extractAllTo(outputPath, true);
};

export const extractArchive = async (inputPath: string, outputPath: string): Promise<void> => {
	const type = getArchiveType(inputPath);
	const extractPath = `${outputPath}/${starlarkLSPExtractedDirectory}`;

	try {
		if (!directoryExists(extractPath)) {
			await createDirectory(extractPath);
		}

		switch (type) {
			case "tar.gz":
				await extractTarGz(inputPath, extractPath);
				break;
			case "tar":
				await extractTar(inputPath, extractPath);
				break;
			case "zip":
				await extractZip(inputPath, extractPath);
				break;
			default:
				throw new Error(`Unsupported archive type: ${type}`);
		}
	} catch (error) {
		throw new Error(`Extraction failed: ${(error as Error).message}`);
	}
};
