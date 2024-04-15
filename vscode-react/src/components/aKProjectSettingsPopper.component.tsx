import React from "react";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import DownloadIcon from "@react-assets/icons/download.svg?react";
import { AKButton } from "@react-components/aKButton.component";
import { sendMessage } from "@react-utilities";

export const ProjectSettingsPopper = ({ resourcesDir }: { resourcesDir: string }) => (
	<div className="relative">
		<div className="mb-4">
			<strong>{resourcesDir}</strong>
		</div>
		<div className="flex justify-between w-full">
			<AKButton
				onClick={() => sendMessage(MessageType.copyProjectPath, resourcesDir)}
				classes="w-1/2"
				title={translate().t("reactApp.settings.copyPath")}
			>
				<div className="codicon codicon-copy text-vscode-foreground"></div>
			</AKButton>
			<AKButton
				onClick={() => sendMessage(MessageType.openProjectResourcesDirectory, resourcesDir)}
				classes="ml-4 w-1/2"
				title={translate().t("reactApp.settings.openProjectResourcesDirectory")}
			>
				<div className="codicon codicon-folder-opened text-vscode-foreground"></div>
			</AKButton>
			<AKButton
				onClick={() => sendMessage(MessageType.onClickSetResourcesDirectory)}
				title={translate().t("reactApp.settings.downloadDirectoryOfExecutables")}
				classes="ml-4 w-1/2"
			>
				<DownloadIcon className="text-vscode-background text-vscode-foreground" />
			</AKButton>
			<AKButton
				onClick={() => sendMessage(MessageType.deleteProject)}
				classes="ml-4 w-1/2"
				title={translate().t("reactApp.settings.deleteProject")}
			>
				<div className="codicon codicon-trash text-vscode-foreground" />
			</AKButton>
		</div>
	</div>
);
