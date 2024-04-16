import React, { ReactNode } from "react";

interface AKTableHeaderCellProps {
	children: ReactNode;
	className?: string;
	colSpan?: number;
}

export const AKTableHeaderCell = ({ children, className, colSpan }: AKTableHeaderCellProps) => {
	return (
		<th className={className} colSpan={colSpan}>
			{children}
		</th>
	);
};
