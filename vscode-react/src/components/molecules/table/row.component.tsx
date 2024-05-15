import React, { ReactNode } from "react";
import clsx from "clsx";

interface RowProps {
	children: ReactNode;
	isSelected?: boolean;
	className?: string;
	style?: React.CSSProperties;
	onClick?: () => void;
}

export const Row = ({ children, isSelected, className, style, onClick }: RowProps) => {
	const rowClass = clsx(isSelected && "bg-vscode-editor-selectionBackground", className);
	return (
		<tr className={rowClass} style={style} onClick={onClick}>
			{children}
		</tr>
	);
};
