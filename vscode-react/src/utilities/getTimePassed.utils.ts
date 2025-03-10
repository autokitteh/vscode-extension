import moment from "moment";

export const getTimePassed = (startDate: Date): string => {
	const now = moment();
	const daysPassed = now.diff(startDate as unknown as string, "days");
	if (daysPassed >= 1) {
		return moment(startDate as unknown as string).fromNow();
	}

	return moment(startDate as unknown as string).format("YYYY/MM/DD HH:mm:ss");
};
