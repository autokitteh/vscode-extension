import React, { ReactNode } from "react";

interface AKCellProps {
	children: ReactNode;
}

export const AKTableCell = ({ children }: AKCellProps) => {
	return <div className="flex-1 flex justify-center p-1">{children}</div>;
};
