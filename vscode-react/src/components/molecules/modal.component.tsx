import React, { ReactNode } from "react";

import clsx from "clsx";

type ModalProps = {
	children: ReactNode;
	wrapperClasses?: Array<string>;
	classes?: Array<string>;
};
export const Modal = ({ children, wrapperClasses, classes }: ModalProps) => {
	const wrapperClass = clsx(
		"absolute right-0 top-0 z-40 size-full bg-vscode-editor-background opacity-100",
		wrapperClasses
	);

	const modalClasses = clsx("absolute left-1/2 size-full -translate-x-1/2 rounded-3xl px-14 pb-8 opacity-100", classes);

	return (
		<div className={wrapperClass}>
			<div className={modalClasses}>{children}</div>
		</div>
	);
};
