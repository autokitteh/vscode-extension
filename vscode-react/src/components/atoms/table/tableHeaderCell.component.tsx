import React, { ReactNode } from "react";

interface TableHeaderCellProps {
	children: ReactNode;
}

export const TableHeaderCell = ({ children }: TableHeaderCellProps) => {
	return <th>{children}</th>;
};
