import React, { ReactNode } from "react";

interface TableMessageProps {
	children: ReactNode;
}

export const TableMessage = ({ children }: TableMessageProps) => {
	return <div className="w-full text-center m-4">{children}</div>;
};
