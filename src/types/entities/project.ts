export type Project = {
	name: string;
	ownerId: string;
	projectId: string;
	rootPath: string;
	mainPath: string;
};

export type BuildProjectResponse = {
	buildId?: string;
	error?: Error;
};

export type Location = {
	path?: string;
	row?: number;
	col?: number;
	name?: string;
};

export type Callframe = {
	name?: string;
	location?: Location;
};

export type Error = {
	message: string;
	callstack?: Callframe[];
	extra?: Record<string, string>;
};
