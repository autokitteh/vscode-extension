import React, { ReactNode } from "react";

interface AKTableRowProps {
	children: ReactNode;
}

export const AKTableRow = ({ children }: AKTableRowProps) => {
	return <div className="flex justify-around bg-tab-active-foreground w-[80rem]">{children}</div>;
};
