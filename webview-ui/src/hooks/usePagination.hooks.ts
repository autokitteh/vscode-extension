import { useState, useCallback, useEffect } from "react";
import { MessageType, PaginationListEntity } from "@enums";
import { sendMessage } from "@react-utilities";

export const usePagination = (
	defaultPageSize: number,
	totalItems: number,
	listType: PaginationListEntity
) => {
	const [startIndex, setStartIndex] = useState(0);
	const [endIndex, setEndIndex] = useState(defaultPageSize);

	const updatePageSize = useCallback(() => {
		if (totalItems <= defaultPageSize) {
			setEndIndex(totalItems);
		} else {
			setEndIndex(defaultPageSize);
		}
	}, [totalItems, defaultPageSize]);

	useEffect(() => {
		updatePageSize();
	}, [updatePageSize]);

	const showMore = useCallback(() => {
		const newEndIndex = Math.min(endIndex + defaultPageSize, totalItems);
		setEndIndex(newEndIndex);
		sendMessage(MessageType.setPageSize, { startIndex, endIndex: newEndIndex, entity: listType });
	}, [startIndex, endIndex, totalItems, defaultPageSize]);

	const showLess = useCallback(() => {
		setEndIndex(defaultPageSize);
		sendMessage(MessageType.setPageSize, {
			startIndex: 0,
			endIndex: defaultPageSize,
			entity: listType,
		});
	}, [defaultPageSize]);

	return { startIndex, endIndex, showMore, showLess };
};
