import React, { ReactNode } from "react";

interface AKTableRowProps {
	children: ReactNode;
}

export const AKTableRow = ({ children }: AKTableRowProps) => {
	return <tr className="bg-tab-active-foreground">{children}</tr>;
};
