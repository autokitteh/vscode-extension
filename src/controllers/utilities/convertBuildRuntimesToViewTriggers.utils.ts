import { SUPPORTED_MANUAL_RUN_PROGRAMMING_LANGUAGES, SUPPORTED_MANUAL_RUN_RUNTIMES, namespaces } from "@constants";
import { LoggerService } from "@services";
import { BuildInfoRuntimes } from "@type/models";

const processRuntime = (runtime: BuildInfoRuntimes): string[] => {
	if (!runtime?.artifact?.compiled_data) {
		return [];
	}
	const fileNames = Object.keys(runtime.artifact.compiled_data).filter((fileName) =>
		SUPPORTED_MANUAL_RUN_PROGRAMMING_LANGUAGES.some((ext: string) => fileName.endsWith(ext))
	);
	return fileNames;
};

export const convertBuildRuntimesToViewTriggers = (runtimes: BuildInfoRuntimes[]): string[] => {
	try {
		const runtime = runtimes.find((runtime) => SUPPORTED_MANUAL_RUN_RUNTIMES.includes(runtime?.info?.name || ""));

		if (runtime) {
			return processRuntime(runtime);
		}
	} catch (error) {
		LoggerService.error(namespaces.buildRuntimeEntrypoints, (error as Error).message);

		return [];
	}

	return [];
};
