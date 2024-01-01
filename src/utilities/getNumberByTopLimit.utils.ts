export const getByTopLimit = (current: number, added: number, topLimit: number): number => {
	const potentialNewLength = current + added;

	const exceedsTotal = topLimit && potentialNewLength > topLimit;
	const endIndex = exceedsTotal ? topLimit : potentialNewLength;

	return exceedsTotal ? topLimit : endIndex;
};
