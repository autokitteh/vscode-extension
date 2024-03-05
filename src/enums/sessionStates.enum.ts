export enum SessionLogTypes {
	print = "print",
	unknown = "unknown",
	state = "state",
	callSpec = "callSpec",
	callAttemptStart = "callAttemptStart",
	callAttemptComplete = "callAttemptComplete",
}
export enum SessionLogStateTypes {
	created = "created",
	running = "running",
	error = "error",
	completed = "completed",
}
