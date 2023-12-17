import { initTranslate } from "@i18n/init";
import * as i18n from "i18next";
import { ExtensionContext } from "vscode";

export class SharedContext {
	private static _extContext: ExtensionContext;
	private static _i18n: typeof i18n;

	public static get context(): ExtensionContext {
		return this._extContext;
	}

	public static set context(ec: ExtensionContext) {
		this._extContext = ec;
	}

	public static get i18n(): typeof i18n {
		if (this._extContext?.globalState) {
			return this._extContext?.globalState?.get("i18n") as typeof i18n;
		} else {
			if (this._i18n) {
				return this._i18n;
			} else {
				this._i18n = initTranslate();
				return this._i18n;
			}
		}
	}

	public static set i18n(i18nInstance: typeof i18n) {
		if (this._extContext) {
			this._i18n = i18nInstance;
			this._extContext.globalState.update("i18n", i18nInstance);
		}
	}
}
