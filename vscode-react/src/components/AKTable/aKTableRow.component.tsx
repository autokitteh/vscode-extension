import React, { ReactNode } from "react";
import clsx from "clsx";

interface AKTableRowProps {
	children: ReactNode;
	isSelected?: boolean;
	className?: string;
	style?: React.CSSProperties;
}

export const AKTableRow = ({ children, isSelected, className, style }: AKTableRowProps) => {
	const rowClass = clsx(isSelected && "bg-vscode-editor-selectionBackground", className);
	return (
		<tr className={rowClass} style={style}>
			{children}
		</tr>
	);
};
