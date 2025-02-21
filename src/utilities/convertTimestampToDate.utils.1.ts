import { ProtoTimestamp } from "@type/utilities";

export const convertTimestampToDate = (timestamp: unknown): Date => {
	const timestampConverted = timestamp as ProtoTimestamp;

	if (!timestampConverted?.seconds) {
		return new Date();
	}
	const milliseconds = timestampConverted.seconds * BigInt(1000);

	return new Date(Number(milliseconds));
};
