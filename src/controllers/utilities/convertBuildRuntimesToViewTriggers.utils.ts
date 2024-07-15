import { namespaces } from "@constants";
import { LoggerService } from "@services";
import { BuildInfoRuntimes, EntrypointTrigger, SessionEntrypoint } from "@type/models";

export const convertBuildRuntimesToViewTriggers = (
	runtimes: BuildInfoRuntimes[]
): Record<string, SessionEntrypoint[]> => {
	const resultTriggers: Record<string, SessionEntrypoint[]> = {};

	try {
		const isPython = runtimes.some((runtime) => runtime.info.name === "python");

		if (isPython) {
			const pythonRuntime = runtimes.find((runtime) => runtime.info.name === "python");
			if (!pythonRuntime) {
				return {};
			}

			const filesNames = Object.keys(pythonRuntime.artifact.compiled_data);
			for (let i = 0; i < filesNames.length; i++) {
				resultTriggers[filesNames[i]] = resultTriggers[filesNames[i]] || [];

				const sessionEntrypoints = pythonRuntime.artifact.exports
					.filter((entrypoint: EntrypointTrigger) => entrypoint.location.path === filesNames[i])
					.map((entrypoint: EntrypointTrigger) => ({
						...entrypoint.location,
						name: entrypoint.symbol,
					}));

				resultTriggers[filesNames[i]].push(...sessionEntrypoints);
			}
		} else {
			const isStarlark = runtimes.some((runtime) => runtime.info.name === "starlark");

			if (isStarlark) {
				const stalarkRuntime = runtimes.find((runtime) => runtime.info.name === "starlark");
				if (!stalarkRuntime) {
					return {};
				}
				const filesNames = Object.keys(stalarkRuntime.artifact.compiled_data);
				for (let i = 0; i < filesNames.length; i++) {
					resultTriggers[filesNames[i]] = resultTriggers[filesNames[i]] || [];

					const sessionEntrypoints = stalarkRuntime.artifact.exports
						.filter((entrypoint: EntrypointTrigger) => entrypoint.location.path === filesNames[i])
						.map((entrypoint: EntrypointTrigger) => ({
							...entrypoint.location,
							name: entrypoint.symbol,
						}));

					resultTriggers[filesNames[i]].push(...sessionEntrypoints);
				}
			}
		}
	} catch (error) {
		LoggerService.error(namespaces.buildRuntimeEntrypoints, (error as Error).message);

		return {};
	}

	return resultTriggers;
};
