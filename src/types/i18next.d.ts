import { english } from "@i18n/en";

declare module "i18next" {
	interface CustomTypeOptions {
		defaultNS: "t";
		resources: {
			t: typeof english;
		};
	}
}
