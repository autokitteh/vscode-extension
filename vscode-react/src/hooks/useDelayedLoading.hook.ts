import { useEffect, useState } from "react";

export const useDelayedLoading = (loading: boolean, delay: number): boolean => {
	const [delayedLoading, setDelayedLoading] = useState(false);

	useEffect(() => {
		let timeoutId: NodeJS.Timeout | undefined;
		if (loading) {
			timeoutId = setTimeout(() => setDelayedLoading(true), delay);
		} else {
			clearTimeout(timeoutId);
			setDelayedLoading(false);
		}
		return () => clearTimeout(timeoutId);
	}, [loading, delay]);

	return delayedLoading;
};

export default useDelayedLoading;
