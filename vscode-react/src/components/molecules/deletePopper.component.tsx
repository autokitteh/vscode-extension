import React, { MouseEvent } from "react";
import { translate } from "@i18n";
import { Button } from "@react-components/atoms/button.component";

interface DeletePopperProps {
	onConfirm: () => void;
	onDismiss: () => void;
	translations: {
		title: string;
		subtitle: string;
	};
}

export const DeletePopper: React.FC<DeletePopperProps> = ({ onConfirm, onDismiss, translations }) => {
	const onConfirmClick = (event: MouseEvent<HTMLElement> | undefined) => {
		event?.stopPropagation();
		onConfirm();
	};

	return (
		<div className="relative shadow-lg">
			<div className="mb-3 text-left">
				<strong>{translations.title}</strong>
				<div>{translations.subtitle}</div>
			</div>
			<div className="flex">
				<Button
					classes="bg-vscode-editor-background text-vscode-foreground"
					onClick={onDismiss}
					title={translate().t("reactApp.general.dismiss")}
				>
					{translate().t("reactApp.general.dismiss")}
				</Button>
				<div className="flex-grow" />
				<Button onClick={onConfirmClick} title={translate().t("reactApp.general.yes")}>
					{translate().t("reactApp.general.yes")}
				</Button>
			</div>
		</div>
	);
};
