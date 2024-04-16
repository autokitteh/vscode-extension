import { differenceInDays, format, formatDistanceToNow } from "date-fns";

export const getTimePassed = (startDate: Date): string => {
	const now = new Date();
	const daysPassed = differenceInDays(now, startDate);

	if (daysPassed >= 1) {
		return formatDistanceToNow(startDate, { addSuffix: true });
	}
	return format(startDate, "yyyy/MM/dd HH:mm:ss");
};
