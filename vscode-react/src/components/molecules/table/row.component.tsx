import React, { ReactNode } from "react";
import clsx from "clsx";

interface RowProps {
	children: ReactNode;
	isSelected?: boolean;
	className?: string;
	style?: React.CSSProperties;
}

export const Row = ({ children, isSelected, className, style }: RowProps) => {
	const rowClass = clsx(isSelected && "bg-vscode-editor-selectionBackground", className);
	return (
		<tr className={rowClass} style={style}>
			{children}
		</tr>
	);
};
