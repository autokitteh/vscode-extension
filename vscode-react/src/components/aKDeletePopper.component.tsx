import React from "react";
import { translate } from "@i18n";
import { Player } from "@lottiefiles/react-lottie-player";
import loaderAnimation from "@react-assets/media/catto-loader.json";
import { AKButton } from "@react-components/aKButton.component";

interface DeletePopperProps {
	isDeletingInProcess: boolean;
	onDeleteConfirm: () => void;
	onDeleteCancel: () => void;
	hasDeleteError: boolean;
	translations: {
		question: string;
		subtitle: string;
		messageLine1: string;
		messageLine2: string;
	};
}

export const DeletePopper: React.FC<DeletePopperProps> = ({
	isDeletingInProcess,
	onDeleteConfirm,
	onDeleteCancel,
	hasDeleteError,
	translations,
}) => (
	<>
		<div className="relative shadow-lg">
			{isDeletingInProcess ? (
				<Player src={loaderAnimation} className="player" loop autoplay />
			) : (
				<>
					<div className="mb-3 text-left">
						<strong>{translations.question}</strong>
						<div>{translations.subtitle}</div>
					</div>
					{hasDeleteError && (
						<div className="text-red-500 text-left">
							{translations.messageLine1}
							<br />
							{translations.messageLine1}
						</div>
					)}
					<div className="flex">
						<AKButton classes="bg-vscode-editor-background text-vscode-foreground" onClick={onDeleteCancel}>
							{translate().t("reactApp.general.no")}
						</AKButton>
						<div className="flex-grow" />
						<AKButton onClick={onDeleteConfirm}>{translate().t("reactApp.general.yes")}</AKButton>
					</div>
				</>
			)}
		</div>
	</>
);
