import React, { ReactNode } from "react";
import clsx from "clsx";

interface TableRowProps {
	children: ReactNode;
	isSelected?: boolean;
}

export const TableRow = ({ children, isSelected }: TableRowProps) => {
	const rowClass = clsx(isSelected && "bg-vscode-editor-selectionBackground");
	return <tr className={rowClass}>{children}</tr>;
};
