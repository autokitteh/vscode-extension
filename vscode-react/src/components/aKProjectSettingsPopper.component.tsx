import React from "react";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import DownloadIcon from "@react-assets/icons/download.svg?react";
import { AKButton } from "@react-components/aKButton.component";
import { sendMessage } from "@react-utilities";

export const ProjectSettingsPopper = ({
	resourcesDir,
	closePopper,
}: {
	resourcesDir: string;
	closePopper: () => void;
}) => {
	const postMessage = (message: MessageType, arg: string | undefined) => {
		sendMessage(message, arg);
		closePopper();
	};

	const formatPath = (path: string, maxLength: number = 40): string => {
		const prefix = "...";

		if (path.length > maxLength) {
			const visibleLength = maxLength - prefix.length;
			return prefix + path.slice(-visibleLength);
		}

		return path;
	};

	return (
		<div className="relative">
			<div className="mb-4" title={resourcesDir}>
				<strong>{formatPath(resourcesDir)}</strong>
			</div>
			<div className="flex justify-between w-full">
				<AKButton
					onClick={() => postMessage(MessageType.copyProjectPath, resourcesDir)}
					classes="w-1/2"
					title={translate().t("reactApp.settings.copyPath")}
				>
					<div className="codicon codicon-copy text-vscode-foreground"></div>
				</AKButton>
				<AKButton
					onClick={() => postMessage(MessageType.openProjectResourcesDirectory, resourcesDir)}
					classes="ml-4 w-1/2"
					title={translate().t("reactApp.settings.openProjectResourcesDirectory")}
				>
					<div className="codicon codicon-folder-opened text-vscode-foreground"></div>
				</AKButton>
				<AKButton
					onClick={() => postMessage(MessageType.onClickSetResourcesDirectory, undefined)}
					title={translate().t("reactApp.settings.downloadDirectoryOfExecutables")}
					classes="ml-4 w-1/2"
				>
					<DownloadIcon className="text-vscode-background text-vscode-foreground" />
				</AKButton>
				<AKButton
					onClick={() => postMessage(MessageType.deleteProject, undefined)}
					classes="ml-4 w-1/2"
					title={translate().t("reactApp.settings.deleteProject")}
				>
					<div className="codicon codicon-trash text-vscode-foreground" />
				</AKButton>
			</div>
		</div>
	);
};
