import { useState, useCallback, useEffect } from "react";
import { MessageType, ProjectViewSections } from "@enums";
import { sendMessage } from "@react-utilities";

export const usePagination = (
	defaultSectionRowsRange: number,
	totalItems: number,
	listType: ProjectViewSections
) => {
	const [startIndex, setStartIndex] = useState(0);
	const [endIndex, setEndIndex] = useState(defaultSectionRowsRange);

	const updateSectionRowsRange = useCallback(() => {
		if (totalItems <= defaultSectionRowsRange) {
			setEndIndex(totalItems);
		} else {
			setEndIndex(defaultSectionRowsRange);
		}
	}, [totalItems, defaultSectionRowsRange]);

	useEffect(() => {
		updateSectionRowsRange();
	}, [updateSectionRowsRange]);

	const showMore = useCallback(() => {
		const newEndIndex = Math.min(endIndex + defaultSectionRowsRange, totalItems);
		setEndIndex(newEndIndex);
		sendMessage(MessageType.setRowsRangePerSection, {
			startIndex,
			endIndex: newEndIndex,
			entity: listType,
		});
	}, [startIndex, endIndex, totalItems, defaultSectionRowsRange]);

	const showLess = useCallback(() => {
		setEndIndex(defaultSectionRowsRange);
		sendMessage(MessageType.setRowsRangePerSection, {
			startIndex: 0,
			endIndex: defaultSectionRowsRange,
			entity: listType,
		});
	}, [defaultSectionRowsRange]);

	return { startIndex, endIndex, showMore, showLess };
};
