import { EntrypointTrigger, SessionEntrypoint } from "@type/models";

type BuildInfoRuntimes = {
	info: {
		name: string;
	};
	artifact: {
		exports: EntrypointTrigger[];
		// eslint-disable-next-line @typescript-eslint/naming-convention
		compiled_data: string;
	};
};

export const convertBuildRuntimesToViewTriggers = (
	runtimes: BuildInfoRuntimes[]
): {
	filesWithFunctions: Record<string, SessionEntrypoint[]>;
	firstFileFunctions: SessionEntrypoint[];
	firstFileName: string;
	firstFunctionValue: string;
	firstEntrypoint: SessionEntrypoint;
} => {
	const resultTriggers: Record<string, SessionEntrypoint[]> = {};

	for (const runtime of runtimes) {
		// TODO: If we add support for other languages, we should add a switch here
		if (runtime.info.name === "starlark") {
			const [fileName] = Object.keys(runtime.artifact.compiled_data);

			resultTriggers[fileName] = resultTriggers[fileName] || [];

			const sessionEntrypoints = runtime.artifact.exports.map((entrypoint: EntrypointTrigger) => ({
				...entrypoint.location,
				name: entrypoint.symbol,
			}));

			resultTriggers[fileName].push(...sessionEntrypoints);
		}
	}

	const firstEntrypoint = resultTriggers[Object.keys(resultTriggers)[0]][0];
	const firstFileFunctions = resultTriggers[Object.keys(resultTriggers)[0]];
	const firstDisplayedFileName = Object.keys(resultTriggers)[0];
	const firstDisplayedFunctionValue = JSON.stringify(firstFileFunctions[0]);

	return {
		filesWithFunctions: resultTriggers,
		firstFileFunctions,
		firstFileName: firstDisplayedFileName,
		firstFunctionValue: firstDisplayedFunctionValue,
		firstEntrypoint,
	};
};
