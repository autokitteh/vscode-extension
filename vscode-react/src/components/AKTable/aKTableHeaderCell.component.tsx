import React, { ReactNode } from "react";

interface AKTableHeaderCellProps {
	children: ReactNode;
}

export const AKTableHeaderCell = ({ children }: AKTableHeaderCellProps) => {
	return <th>{children}</th>;
};
