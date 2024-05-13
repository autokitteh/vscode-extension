import React, { ReactNode } from "react";
import clsx from "clsx";

interface TableRowProps {
	children: ReactNode;
	isSelected?: boolean;
	className?: string;
	style?: React.CSSProperties;
}

export const TableRow = ({ children, isSelected, className, style }: TableRowProps) => {
	const rowClass = clsx(isSelected && "bg-vscode-editor-selectionBackground", className);
	return (
		<tr className={rowClass} style={style}>
			{children}
		</tr>
	);
};
