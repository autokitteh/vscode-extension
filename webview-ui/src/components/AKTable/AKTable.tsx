import React, { ReactNode } from "react";
import clsx from "clsx";

interface AKTableProps {
	children: ReactNode;
	classes?: string;
}

export const AKTable = ({ children, classes }: AKTableProps) => {
	const baseClass = ["w-full flex flex-col"];
	const tableClass = clsx(baseClass, [classes]);

	return <div className={tableClass}>{children}</div>;
};
