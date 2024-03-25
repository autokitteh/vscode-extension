import { useState, useCallback } from "react";

export const usePoppersManager = () => {
	// Change to an object with popper IDs as keys and boolean values for visibility
	const [visiblePoppers, setVisiblePoppers] = useState<{ [key: string]: boolean }>({});

	// Toggle visibility of a specific popper by ID
	const togglePopperVisibility = useCallback((id: string) => {
		setVisiblePoppers((prev) => ({
			...prev,
			[id]: !prev[id],
		}));
	}, []);

	// Toggle visibility of a specific popper by ID
	const setPopperVisibility = useCallback((id: string, visibility: boolean) => {
		setVisiblePoppers((prev) => ({
			...prev,
			[id]: visibility,
		}));
	}, []);

	// Optional: function to hide all poppers
	const hideAllPoppers = useCallback(() => {
		const hiddenPoppers = Object.keys(visiblePoppers).reduce(
			(acc, cur) => {
				acc[cur] = false;
				return acc;
			},
			{} as { [key: string]: boolean }
		);
		setVisiblePoppers(hiddenPoppers);
	}, [visiblePoppers]);

	// Optional: function to show a specific popper and hide others
	const showPopper = useCallback(
		(id: string) => {
			const updatedPoppers = Object.keys(visiblePoppers).reduce(
				(acc, cur) => {
					acc[cur] = cur === id;
					return acc;
				},
				{} as { [key: string]: boolean }
			);
			setVisiblePoppers(updatedPoppers);
		},
		[visiblePoppers]
	);

	const hidePopper = useCallback((id: string) => {
		setVisiblePoppers((prev) => ({
			...prev,
			[id]: false,
		}));
	}, []);

	return {
		visiblePoppers,
		togglePopperVisibility,
		hideAllPoppers,
		showPopper,
		hidePopper,
		setPopperVisibility,
	};
};
