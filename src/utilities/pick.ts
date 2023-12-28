export const pick = <T extends object, K extends keyof T>(
	obj: T,
	keys: K[]
): { [P in K]: T[P] } => {
	const pickedObj: { [P in K]?: T[P] } = {};

	keys.forEach((key) => {
		if (key in obj) {
			pickedObj[key] = obj[key];
		} else {
			throw new Error(`Key '${key as string}' is not present in the object.`);
		}
	});

	return pickedObj as { [P in K]: T[P] };
};
