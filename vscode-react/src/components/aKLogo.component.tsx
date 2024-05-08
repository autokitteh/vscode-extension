import React, { ReactNode } from "react";
import { Theme } from "@enums";
import AKLogoBlack from "@react-assets/images/logo/ak-logo-black.svg?react";
import AKLogoWhite from "@react-assets/images/logo/ak-logo-white.svg?react";
import { useAppState } from "@react-context/appState.context";
import { cn } from "@react-utilities/cnClasses.utils";

type LogoProperties = {
	className: string;
	themeVisualType: Theme | undefined;
};

export const AKLogo = ({ className, themeVisualType }: LogoProperties): ReactNode => {
	const [{ delayedLoading }] = useAppState();
	const logoClass = cn(className, { loading: delayedLoading });

	return themeVisualType === 2 || themeVisualType === 3 ? (
		<AKLogoWhite className={logoClass} fill="white" />
	) : (
		<AKLogoBlack className={logoClass} />
	);
};
