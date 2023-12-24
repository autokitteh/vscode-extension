import React, { ReactNode } from "react";
import AKLogoBlack from "@assets/images/ak-logo-black.svg?react";
import AKLogoWhite from "@assets/images/ak-logo-white.svg?react";
import { Theme } from "@enums/index";

type LogoProperties = {
	className: string;
	themeVisualType: Theme | undefined;
};

export const AKLogo = ({ className, themeVisualType }: LogoProperties): ReactNode =>
	themeVisualType === 2 || themeVisualType === 3 ? (
		<AKLogoWhite className={className} fill="white" />
	) : (
		<AKLogoBlack className={className} />
	);
