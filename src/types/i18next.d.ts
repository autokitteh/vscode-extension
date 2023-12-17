import { english } from "@i18n/en";

declare module "i18next" {
	interface CustomTypeOptions {
		defaultNS: "translation";
		resources: {
			translation: typeof english;
		};
	}
}
