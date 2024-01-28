import React, { ReactNode } from "react";
import clsx from "clsx";

interface AKTableRowProps {
	children: ReactNode;
	isSelected?: boolean;
}

export const AKTableRow = ({ children, isSelected }: AKTableRowProps) => {
	const rowClass = clsx(isSelected && "bg-vscode-editor-selectionBackground");
	return <tr className={rowClass}>{children}</tr>;
};
