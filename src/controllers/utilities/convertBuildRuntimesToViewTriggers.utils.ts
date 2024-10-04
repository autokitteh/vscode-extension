import { namespaces } from "@constants";
import { LoggerService } from "@services";
import { BuildInfoRuntimes } from "@type/models";

const processRuntime = (runtime: BuildInfoRuntimes): string[] => {
	const allowedExtensions = [".py", ".star"];

	const fileNames = Object.keys(runtime.artifact.compiled_data)?.filter((fileName) =>
		allowedExtensions.some((ext) => fileName.endsWith(ext))
	);

	return fileNames;
};

export const convertBuildRuntimesToViewTriggers = (runtimes: BuildInfoRuntimes[]): string[] => {
	try {
		const supportedRuntimes = ["python", "starlark"];

		const runtime = runtimes.find((runtime) => supportedRuntimes.includes(runtime.info.name));

		if (runtime) {
			return processRuntime(runtime);
		}
	} catch (error) {
		LoggerService.error(namespaces.buildRuntimeEntrypoints, (error as Error).message);

		return [];
	}

	return [];
};
