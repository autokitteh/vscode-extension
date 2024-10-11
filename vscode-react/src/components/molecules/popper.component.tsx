import React, { useEffect, useRef, useState } from "react";
import { usePopper } from "react-popper";

import { cn } from "@react-utilities";

interface PopperProps {
<<<<<<< HEAD
	visible: boolean;
	className?: string;
=======
>>>>>>> e2d1b815 (feat: add liferay and perfectionist plugin to eslint of react app)
	children: React.ReactNode;
	referenceRef: React.RefObject<HTMLDivElement>;
	visible: boolean;
}

<<<<<<< HEAD
export const Popper = ({ visible, children, referenceRef, className }: PopperProps) => {
=======
export const Popper: React.FC<PopperProps> = ({ children, referenceRef, visible }) => {
>>>>>>> e2d1b815 (feat: add liferay and perfectionist plugin to eslint of react app)
	const popperRef = useRef<HTMLDivElement | null>(null);
	const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
	const { attributes, styles, update } = usePopper(referenceRef.current, popperElement, {
		modifiers: [
			{
				name: "offset",
				options: {
					offset: [-200, 8],
				},
			},
		],
		placement: "bottom",
	});

	useEffect(() => {
		if (visible && update) {
			update().catch((error) => console.error(error));
		}
	}, [visible, update]);

	useEffect(() => {
		if (visible) {
			setPopperElement(popperRef.current);
		}
	}, [visible]);

	const popperClasses = cn(
		"flex-col z-50 bg-vscode-editor-background text-vscode-foreground border border-gray-300 p-4 rounded-lg shadow-lg",
		className
	);

	return (
		<>
			{visible && (
				<div
					ref={popperRef}
					style={styles.popper}
					{...attributes.popper}
					className={popperClasses}
					onClick={(event) => event.stopPropagation()}
				>
					{children}
				</div>
			)}
		</>
	);
};
