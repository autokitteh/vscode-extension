import React, { ReactNode } from "react";

import clsx from "clsx";

interface CellProps {
	children: ReactNode;
	onClick?: () => void;
	classes?: string[];
}

export const Cell = ({ children, onClick, classes }: CellProps) => {
	const baseClass = "text-center p-1";
	const cellClass = clsx(baseClass, classes);
	return (
		<td className={cellClass} onClick={onClick}>
			{children}
		</td>
	);
};
