import React from "react";
import { translate } from "@i18n";
import { Player } from "@lottiefiles/react-lottie-player";
import loaderAnimation from "@react-assets/media/catto-loader.json";
import { Button } from "@react-components/atoms/aKButton.component";

interface DeletePopperProps {
	isDeletingInProcess: boolean;
	onConfirm: () => void;
	onDismiss: () => void;
	translations: {
		title: string;
		subtitle: string;
	};
}

export const DeletePopper: React.FC<DeletePopperProps> = ({
	isDeletingInProcess,
	onConfirm,
	onDismiss,
	translations,
}) => (
	<>
		<div className="relative shadow-lg">
			{isDeletingInProcess ? (
				<Player src={loaderAnimation} className="player" loop autoplay />
			) : (
				<>
					<div className="mb-3 text-left">
						<strong>{translations.title}</strong>
						<div>{translations.subtitle}</div>
					</div>
					<div className="flex">
						<Button classes="bg-vscode-editor-background text-vscode-foreground" onClick={onDismiss}>
							{translate().t("reactApp.general.no")}
						</Button>
						<div className="flex-grow" />
						<Button onClick={onConfirm}>{translate().t("reactApp.general.yes")}</Button>
					</div>
				</>
			)}
		</div>
	</>
);
