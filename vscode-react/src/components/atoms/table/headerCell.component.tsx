import React, { ReactNode } from "react";

interface HeaderCellProps {
	children: ReactNode;
	className?: string;
	colSpan?: number;
}

export const HeaderCell = ({ children, className, colSpan }: HeaderCellProps) => {
	return (
		<th className={className} colSpan={colSpan}>
			{children}
		</th>
	);
};
