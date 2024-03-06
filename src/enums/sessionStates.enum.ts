export enum SessionLogRecordType {
	print = "print",
	unknown = "unknown",
	state = "state",
	callSpec = "callSpec",
	callAttemptStart = "callAttemptStart",
	callAttemptComplete = "callAttemptComplete",
}
export enum StateOfSessionLogType {
	created = "created",
	running = "running",
	error = "error",
	completed = "completed",
}
