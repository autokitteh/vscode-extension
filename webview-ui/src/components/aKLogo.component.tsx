import React, { ReactNode } from "react";
import { Theme } from "@enums";
import AKLogoBlack from "@react-assets/images/logo/ak-logo-black.svg?react";
import AKLogoWhite from "@react-assets/images/logo/ak-logo-white.svg?react";

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
