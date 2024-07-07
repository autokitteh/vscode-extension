import * as i18n from "i18next";

import { english } from "@i18n/en";

const englishResources = {
	en: {
		translation: english,
	},
};

export const translate = () => {
	if (i18n.hasLoadedNamespace("translation")) {
		return i18n;
	} else {
		i18n.init({
			lng: "en",
			debug: false,
			resources: englishResources,
			fallbackLng: "en",
			ns: ["translation"],
			defaultNS: "translation",
			keySeparator: ".",
			interpolation: {
				escapeValue: false,
			},
		});
		return i18n;
	}
};
