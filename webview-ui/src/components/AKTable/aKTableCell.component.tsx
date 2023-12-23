import React, { ReactNode } from "react";

interface AKCellProps {
	children: ReactNode;
}

export const AKTableCell = ({ children }: AKCellProps) => {
	return <td className="text-center p-1">{children}</td>;
};
