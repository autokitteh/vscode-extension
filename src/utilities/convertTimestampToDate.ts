import { GoTimestamp } from "@type/goTimestamp.type";

/**
 * Converts a gRPC Timestamp to a JavaScript Date object.
 * @param timestamp The gRPC Timestamp object which might have 'seconds' and 'nanoseconds'.
 * @returns The JavaScript Date object.
 */
export const convertTimestampToDate = (timestamp: GoTimestamp): Date => {
	if (!timestamp) {
		return new Date(0); // Return epoch date (January 1, 1970)
	}
	const milliseconds =
		timestamp.seconds * BigInt(1000) +
		BigInt(timestamp.nanoseconds ? timestamp.nanoseconds / 1000000 : 0);

	return new Date(Number(milliseconds));
};
