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
}

export const DeletePopper: React.FC<DeletePopperProps> = ({
	isDeletingInProcess,
	onDeleteConfirm,
	onDeleteCancel,
	hasDeleteError,
}) => (
	<>
		<div className="relative shadow-lg">
			{isDeletingInProcess ? (
				<Player src={loaderAnimation} className="player" loop autoplay />
			) : (
				<>
					<div className="mb-3 text-left">
						<strong>{translate().t("reactApp.deployments.deletionApprovalQuestion")}</strong>
						<div>{translate().t("reactApp.deployments.deletionApprovalQuestionSubtitle")}</div>
					</div>
					{hasDeleteError && (
						<div className="text-red-500 text-left">
							{translate().t("reactApp.deployments.errorDeletingDeploymentLine1")}
							<br />
							{translate().t("reactApp.deployments.errorDeletingDeploymentLine2")}
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
