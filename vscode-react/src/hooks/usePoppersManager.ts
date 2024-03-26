import { useState, useCallback } from "react";

export const usePoppersManager = () => {
	const [visiblePoppers, setVisiblePoppers] = useState<{ [key: string]: boolean }>({});

	const togglePopperVisibility = useCallback((id: string) => {
		setVisiblePoppers((prev) => ({
			...prev,
			[id]: !prev[id],
		}));
	}, []);

	const setPopperVisibility = useCallback((id: string, visibility: boolean) => {
		setVisiblePoppers((prev) => ({
			...prev,
			[id]: visibility,
		}));
	}, []);

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
