export type GoTimestamp =
	| {
			seconds: bigint;
			nanoseconds?: number;
	  }
	| undefined;
