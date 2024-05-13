import React, { ReactNode } from "react";
import { Theme } from "@enums";
import LogoBlack from "@react-assets/images/logo/ak-logo-black.svg?react";
import LogoWhite from "@react-assets/images/logo/ak-logo-white.svg?react";
import { useAppState } from "@react-context/appState.context";
import { cn } from "@react-utilities/cnClasses.utils";

type LogoProperties = {
	className: string;
	themeVisualType: Theme | undefined;
};

export const Logo = ({ className, themeVisualType }: LogoProperties): ReactNode => {
	const [{ delayedLoading }] = useAppState();
	const logoClass = cn(className, { loading: delayedLoading });

	return themeVisualType === 2 || themeVisualType === 3 ? (
		<LogoWhite className={logoClass} fill="white" />
	) : (
		<LogoBlack className={logoClass} />
	);
};
