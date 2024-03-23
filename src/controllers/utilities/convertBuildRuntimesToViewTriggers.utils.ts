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
): Record<string, SessionEntrypoint[]> => {
	const resultTriggers: Record<string, SessionEntrypoint[]> = {};

	for (const runtime of runtimes) {
		// TODO: If we add support for other languages, we should add a switch here
		if (runtime.info.name === "starlark") {
			const filesNames = Object.keys(runtime.artifact.compiled_data);
			for (let i = 0; i < filesNames.length; i++) {
				resultTriggers[filesNames[i]] = resultTriggers[filesNames[i]] || [];

				const sessionEntrypoints = runtime.artifact.exports
					.filter((entrypoint: EntrypointTrigger) => entrypoint.location.path === filesNames[i])
					.map((entrypoint: EntrypointTrigger) => ({
						...entrypoint.location,
						name: entrypoint.symbol,
					}));

				resultTriggers[filesNames[i]].push(...sessionEntrypoints);
			}
		}
	}

	return resultTriggers;
};
