import React, { ReactNode } from "react";

interface AKCellProps {
	children: ReactNode;
	classes?: string[];
}

export const AKTableCell = ({ children, classes }: AKCellProps) => {
	return <td className={`text-center p-1 ${classes}`}>{children}</td>;
};
