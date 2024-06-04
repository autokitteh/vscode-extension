import React, { ReactNode } from "react";
import LogoBlack from "@react-assets/images/logo/ak-logo-black.svg?react";
import LogoWhite from "@react-assets/images/logo/ak-logo-white.svg?react";
import { useAppState } from "@react-context/appState.context";
import { cn } from "@react-utilities/cnClasses.utils";

type LogoProperties = {
	className: string;
};

export const Logo = ({ className }: LogoProperties): ReactNode => {
	const [{ delayedLoading, themeType }] = useAppState();
	const logoClass = cn(className, { loading: delayedLoading });

	return themeType === 2 || themeType === 3 ? (
		<LogoWhite className={logoClass} fill="white" />
	) : (
		<LogoBlack className={logoClass} />
	);
};
