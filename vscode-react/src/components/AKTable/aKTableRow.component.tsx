import React, { ReactNode } from "react";
import clsx from "clsx";

interface AKTableRowProps {
	children: ReactNode;
	isSelected?: boolean;
}

export const AKTableRow = ({ children, isSelected }: AKTableRowProps) => {
	const baseClass = "bg-tab-active-foreground";
	const rowClass = clsx(baseClass, isSelected && "bg-gray-600");
	return <tr className={rowClass}>{children}</tr>;
};
