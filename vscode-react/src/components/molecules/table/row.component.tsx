import clsx from "clsx";
import React, { ReactNode } from "react";

interface RowProps {
	children: ReactNode;
	className?: string;
	isSelected?: boolean;
	onClick?: () => void;
	style?: React.CSSProperties;
}

export const Row = ({ children, className, isSelected, onClick, style }: RowProps) => {
	const rowClass = clsx(isSelected && "bg-vscode-editor-selectionBackground", className);

	return (
		<tr className={rowClass} onClick={onClick} style={style}>
			{children}
		</tr>
	);
};
