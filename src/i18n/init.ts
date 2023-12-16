import { english } from "@i18n/en";
import * as i18n from "i18next";

const englishTranslations = Object.keys(english).reduce((acc, key) => {
	return Object.assign(acc, { ...english[key as keyof typeof english] });
}, {});

const englishResources = {
	en: {
		translation: englishTranslations,
	},
};

export const initTranslate = () => {
	i18n.init({
		lng: "en",
		debug: true,
		resources: englishResources,
		fallbackLng: "en",
		ns: ["t"],
		defaultNS: "t",
	});
	return i18n;
};
