import { initTranslate } from "@i18n/init";
import * as i18n from "i18next";
import { ExtensionContext } from "vscode";

export class SharedContext {
	private static _extContext: ExtensionContext;

	public static get context(): ExtensionContext {
		return this._extContext;
	}

	public static set context(ec: ExtensionContext) {
		this._extContext = ec;
	}

	public static get i18n(): typeof i18n {
		if (this._extContext?.globalState) {
			return this._extContext?.globalState?.get("i18n") as typeof i18n;
		}
		return initTranslate();
	}

	public static set i18n(i18nInstance: typeof i18n) {
		if (this._extContext) {
			this._extContext.globalState.update("i18n", i18nInstance);
		}
	}
}
