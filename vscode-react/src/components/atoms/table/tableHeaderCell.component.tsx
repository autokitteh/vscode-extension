import React, { ReactNode } from "react";

interface TableHeaderCellProps {
	children: ReactNode;
	className?: string;
	colSpan?: number;
}

export const TableHeaderCell = ({ children, className, colSpan }: TableHeaderCellProps) => {
	return (
		<th className={className} colSpan={colSpan}>
			{children}
		</th>
	);
};
