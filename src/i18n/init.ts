import { english } from "@i18n/en";
import * as i18n from "i18next";

const englishResources = {
	en: {
		translation: english,
	},
};

export const initTranslate = () => {
	i18n.init({
		lng: "en",
		debug: true,
		resources: englishResources,
		fallbackLng: "en",
		ns: ["translation"],
		defaultNS: "translation",
	});
	return i18n;
};
