// useForceRerender.js
import { useEffect, useState } from "react";

export const useForceRerender = () => {
	const [, setTick] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setTick((tick) => tick + 1);
		}, 1000);

		return () => clearInterval(interval);
	}, []);
};
