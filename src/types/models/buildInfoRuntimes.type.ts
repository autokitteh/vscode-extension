import { EntrypointTrigger } from "@type/models/session.type";

export type BuildInfoRuntimes = {
	info: {
		name: string;
	};
	artifact: {
		exports: EntrypointTrigger[];
		// eslint-disable-next-line @typescript-eslint/naming-convention
		compiled_data: string;
	};
};
