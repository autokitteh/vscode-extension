import clsx from "clsx";
import React, { ReactNode } from "react";

interface CellProps {
	children: ReactNode;
	classes?: string[];
	onClick?: () => void;
}

export const Cell = ({ children, classes, onClick }: CellProps) => {
	const baseClass = "text-center p-1";
	const cellClass = clsx(baseClass, classes);

	return (
		<td className={cellClass} onClick={onClick}>
			{children}
		</td>
	);
};
