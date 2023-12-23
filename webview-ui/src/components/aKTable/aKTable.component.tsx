import React, { ReactNode } from "react";
import clsx from "clsx";

interface AKTableProps {
	children: ReactNode;
	classes?: string;
}

export const AKTable = ({ children, classes }: AKTableProps) => {
	const baseClass = ["w-full"];
	const tableClass = clsx(baseClass, [classes]);

	return <table className={tableClass}>{children}</table>;
};
