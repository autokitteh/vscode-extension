import { MessageType } from "@enums";
import { translate } from "@i18n";
import { DownloadIcon } from "@react-assets/icons/download.icon";
import ImportIcon from "@react-assets/icons/file-import.svg?react";
import { Button } from "@react-components/atoms/button.component";
import { sendMessage } from "@react-utilities";
import React from "react";

export const ProjectSettingsPopper = ({
	closePopper,
	resourcesDir,
}: {
	closePopper: () => void;
	resourcesDir: string;
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
		<div className="relative w-[17rem]">
			<div className="mb-4" title={resourcesDir}>
				<strong>{formatPath(resourcesDir)}</strong>
			</div>
			<div className="flex w-full justify-between">
				<Button
					classes="w-1/5"
					onClick={() => postMessage(MessageType.copyProjectPath, resourcesDir)}
					title={translate().t("reactApp.settings.copyPath")}
				>
					<div className="codicon codicon-copy fill-text-vscode-foreground"></div>
				</Button>
				<Button
					classes="ml-4 w-1/5"
					onClick={() => postMessage(MessageType.openProjectResourcesDirectory, resourcesDir)}
					title={translate().t("reactApp.settings.openProjectResourcesDirectory")}
				>
					<div className="codicon codicon-folder-opened fill-text-vscode-foreground"></div>
				</Button>
				<Button
					classes="ml-4 w-1/5"
					onClick={() => postMessage(MessageType.setProjectResourcesDirectory, resourcesDir)}
					title={translate().t("reactApp.settings.setProjectResourcesDirectory")}
				>
					<ImportIcon className="fill-text-vscode-foreground" />
				</Button>
				<Button
					classes="ml-4 w-1/5"
					onClick={() => postMessage(MessageType.onClickSetResourcesDirectory, undefined)}
					title={translate().t("reactApp.settings.downloadDirectoryOfExecutables")}
				>
					<DownloadIcon className="fill-text-vscode-foreground" />
				</Button>
				<Button
					classes="ml-4 w-1/5"
					onClick={() => postMessage(MessageType.deleteProject, undefined)}
					title={translate().t("reactApp.settings.deleteProject")}
				>
					<div className="codicon codicon-trash fill-text-vscode-foreground" />
				</Button>
			</div>
		</div>
	);
};
