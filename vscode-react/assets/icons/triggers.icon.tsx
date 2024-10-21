/* eslint-disable max-len */
import React from "react";

import { cn } from "../../src/utilities/cnClasses.utils";

// Taken from here: https://github.com/tabler/tabler-icons/blob/main/icons/outline/bolt.svg under MIT License
export const TriggersIcon = ({ className }: React.SVGProps<SVGSVGElement>) => {
	const classes = cn("icon icon-tabler icons-tabler-outline icon-tabler-bolt", className);

	return (
		<svg
			className={classes}
			fill="none"
			height="24"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
			viewBox="0 0 24 24"
			width="24"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path d="M0 0h24v24H0z" fill="none" stroke="none" />
			<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />
		</svg>
	);
};
