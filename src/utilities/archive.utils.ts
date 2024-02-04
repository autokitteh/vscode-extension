import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as util from "util";
import * as zlib from "zlib";
import { translate } from "@i18n";
import AdmZip from "adm-zip";
import * as tarFs from "tar-fs";

const execPromise = util.promisify(exec);

function getArchiveType(filename: string): string {
	const ext = path.extname(filename).toLowerCase();
	if (ext === ".xz") {
		return "tar.xz";
	}
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
}

async function extractXzFile(inputPath: string, outputPath: string): Promise<string> {
	if (!fs.existsSync(outputPath)) {
		fs.mkdirSync(outputPath, { recursive: true });
	}

	const outputFilePath = path.join(outputPath, path.basename(inputPath, ".xz"));
	const command = `xz -d -k -f -c "${inputPath}" > "${outputFilePath}"`;

	try {
		await execPromise(command);
		console.log(`Successfully extracted ${inputPath} to ${outputFilePath}`);
		return outputFilePath;
	} catch (error) {
		throw new Error(`Failed to extract ${inputPath}: ${(error as Error).message}`);
	}
}

async function extractTarGz(inputPath: string, outputPath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const decompressor = zlib.createGunzip();
		const input = fs.createReadStream(inputPath);
		const output = tarFs.extract(outputPath);

		input
			.pipe(decompressor)
			.pipe(output)
			.on("finish", () => resolve(outputPath))
			.on("error", (error) => reject(new Error(`Failed to extract ${inputPath}: ${error.message}`)));
	});
}

async function extractTar(inputPath: string, outputPath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const input = fs.createReadStream(inputPath);
		const output = tarFs.extract(outputPath);

		input
			.pipe(output)
			.on("finish", () => resolve(outputPath))
			.on("error", (error) => reject(new Error(`Failed to extract ${inputPath}: ${error.message}`)));
	});
}

async function extractZip(inputPath: string, outputPath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		try {
			const zip = new AdmZip(inputPath);
			zip.extractAllTo(outputPath, true);
			resolve(outputPath);
		} catch (error) {
			reject(new Error(`Failed to extract ${inputPath}: ${(error as Error).message}`));
		}
	});
}

export async function extractArchive(inputPath: string, outputPath: string): Promise<string> {
	const type = getArchiveType(inputPath);

	try {
		switch (type) {
			case "tar.xz":
				const tarPath = await extractXzFile(inputPath, outputPath);
				return await extractTar(tarPath, outputPath);

			case "tar.gz":
				return await extractTarGz(inputPath, outputPath);

			case "tar":
				return await extractTar(inputPath, outputPath);

			case "zip":
				return await extractZip(inputPath, outputPath);

			default:
				throw new Error(translate().t("errors.unsupportedArchiveType", { type }));
		}
	} catch (error) {
		throw new Error(translate().t("errors.errorExtractingArchive", { error: (error as Error).message }));
	}
}
