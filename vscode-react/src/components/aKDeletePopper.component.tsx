import React from "react";
import { translate } from "@i18n";
import { AKButton } from "@react-components/aKButton.component";

interface DeletePopperProps {
	onConfirm: () => void;
	onDismiss: () => void;
	translations: {
		title: string;
		subtitle: string;
	};
}

export const DeletePopper: React.FC<DeletePopperProps> = ({ onConfirm, onDismiss, translations }) => (
	<div className="relative shadow-lg">
		<div className="mb-3 text-left">
			<strong>{translations.title}</strong>
			<div>{translations.subtitle}</div>
		</div>
		<div className="flex">
			<AKButton
				classes="bg-vscode-editor-background text-vscode-foreground"
				onClick={onDismiss}
				title={translate().t("reactApp.general.dismiss")}
			>
				{translate().t("reactApp.general.dismiss")}
			</AKButton>
			<div className="flex-grow" />
			<AKButton onClick={onConfirm} title={translate().t("reactApp.general.yes")}>
				{translate().t("reactApp.general.yes")}
			</AKButton>
		</div>
	</div>
);
