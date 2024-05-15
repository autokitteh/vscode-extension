import React, { ReactNode } from "react";
import clsx from "clsx";

interface TableProps {
	children: ReactNode;
	classes?: string;
}

export const Table = ({ children, classes }: TableProps) => {
	const baseClass = ["w-full"];
	const tableClass = clsx(baseClass, [classes]);

	return <table className={tableClass}>{children}</table>;
};
