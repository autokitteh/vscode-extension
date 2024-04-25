import React, { ReactNode } from "react";
import clsx from "clsx";

interface AKTableRowProps {
	children: ReactNode;
	isSelected?: boolean;
	className?: string;
}

export const AKTableRow = ({ children, isSelected, className }: AKTableRowProps) => {
	const rowClass = clsx(isSelected && "bg-vscode-editor-selectionBackground", className);
	return <tr className={rowClass}>{children}</tr>;
};
