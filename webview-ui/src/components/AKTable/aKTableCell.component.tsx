import React, { ReactNode } from "react";
import clsx from "clsx";

interface AKCellProps {
	children: ReactNode;
	onClick?: () => void;
	classes?: string[];
}

export const AKTableCell = ({ children, onClick, classes }: AKCellProps) => {
	const baseClass = "text-center p-1";
	const cellClass = clsx(baseClass, classes);
	return (
		<td className={cellClass} onClick={onClick}>
			{children}
		</td>
	);
};
