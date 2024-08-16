import React, { ReactNode, useEffect, useState } from "react";

import LogoBlack from "@react-assets/images/logo/ak-logo-black.svg?react";
import LogoWhite from "@react-assets/images/logo/ak-logo-white.svg?react";
import { useAppState } from "@react-context/appState.context";
import { cn } from "@react-utilities/cnClasses.utils";

type LogoProperties = {
	className: string;
};

export const Logo = ({ className }: LogoProperties): ReactNode => {
	const [{ delayedLoading, themeType }] = useAppState();
	const [shouldRotate, setShouldRotate] = useState(false);
	const [hasRotatedOnce, setHasRotatedOnce] = useState(false);

	useEffect(() => {
		if (delayedLoading && !hasRotatedOnce) {
			setShouldRotate(true);
			setHasRotatedOnce(true);
			setTimeout(() => setShouldRotate(false), 2000);
		}
	}, [delayedLoading, hasRotatedOnce]);

	const logoClass = cn(className, { loading: shouldRotate });

	return themeType === 2 || themeType === 3 ? (
		<LogoWhite className={logoClass} fill="white" />
	) : (
		<LogoBlack className={logoClass} />
	);
};
