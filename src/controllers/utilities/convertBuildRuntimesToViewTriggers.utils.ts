import { namespaces } from "@constants";
import { LoggerService } from "@services";
import { BuildInfoRuntimes, SessionEntrypoint } from "@type/models";

const processRuntime = (runtime: BuildInfoRuntimes): Record<string, SessionEntrypoint[]> => {
	const result: Record<string, SessionEntrypoint[]> = {};
	const fileNames = Object.keys(runtime.artifact.compiled_data);

	fileNames.forEach((fileName) => {
		const seen = new Set();

		result[fileName] = runtime.artifact.exports
			.filter(
				({ location: { path }, symbol: name }) => path === fileName && !name.startsWith("_") && name !== "archive"
			)
			.map(({ location, symbol: name }) => ({
				...location,
				name,
			}))
			.filter(({ path, row, col, name }) => {
				const key = `${path}:${row}:${col}:${name}`;
				if (seen.has(key)) {
					return false;
				}
				seen.add(key);
				return true;
			});
	});

	return result;
};

export const convertBuildRuntimesToViewTriggers = (
	runtimes: BuildInfoRuntimes[]
): Record<string, SessionEntrypoint[]> => {
	try {
		const supportedRuntimes = ["python", "starlark"];

		const runtime = runtimes.find((runtime) => supportedRuntimes.includes(runtime.info.name));

		if (runtime) {
			return processRuntime(runtime);
		}
	} catch (error) {
		LoggerService.error(namespaces.buildRuntimeEntrypoints, (error as Error).message);

		return {};
	}

	return {};
};
