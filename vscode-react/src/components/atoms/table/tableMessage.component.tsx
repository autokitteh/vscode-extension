import React, { ReactNode } from "react";

interface TableMessageProps {
	children: ReactNode;
}

export const TableMessage = ({ children }: TableMessageProps) => {
	return <div className="m-4 w-full text-center">{children}</div>;
};
