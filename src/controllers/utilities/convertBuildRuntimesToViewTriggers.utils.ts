import { namespaces } from "@constants";
import { LoggerService } from "@services";
import { BuildInfoRuntimes, EntrypointTrigger, SessionEntrypoint } from "@type/models";

const processRuntime = (runtime: BuildInfoRuntimes): Record<string, SessionEntrypoint[]> => {
	const result: Record<string, SessionEntrypoint[]> = {};
	const filesNames = Object.keys(runtime.artifact.compiled_data);

	filesNames.forEach((fileName) => {
		result[fileName] = (result[fileName] || []).concat(
			runtime.artifact.exports
				.filter((entrypoint: EntrypointTrigger) => entrypoint.location.path === fileName)
				.map((entrypoint: EntrypointTrigger) => ({
					...entrypoint.location,
					name: entrypoint.symbol,
				}))
		);
	});

	return result;
};

export const convertBuildRuntimesToViewTriggers = (
	runtimes: BuildInfoRuntimes[]
): Record<string, SessionEntrypoint[]> => {
	try {
		const pythonRuntime = runtimes.find((runtime) => runtime.info.name === "python");
		if (pythonRuntime) {
			return processRuntime(pythonRuntime);
		}

		const starlarkRuntime = runtimes.find((runtime) => runtime.info.name === "starlark");
		if (starlarkRuntime) {
			return processRuntime(starlarkRuntime);
		}
	} catch (error) {
		LoggerService.error(namespaces.buildRuntimeEntrypoints, (error as Error).message);
		return {};
	}

	return {};
};
