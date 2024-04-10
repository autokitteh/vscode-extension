import React from "react";
import { MessageType } from "@enums";
import { translate } from "@i18n";
import DownloadIcon from "@react-assets/icons/download.svg?react";
import { AKButton } from "@react-components/aKButton.component";
import { sendMessage } from "@react-utilities";

export const DirectoryDownloadPopper = ({ resourcesDir }: { resourcesDir: string }) => (
	<div className="relative">
		<div className="text-left flex items-center">
			<strong className="ml-2">{resourcesDir}</strong>
			<AKButton
				onClick={() => sendMessage(MessageType.copyProjectPath, resourcesDir)}
				classes="bg-transparent ml-2"
				title={translate().t("reactApp.settings.copyPath")}
			>
				<div className="codicon codicon-copy text-vscode-foreground"></div>
			</AKButton>
			<AKButton
				onClick={() => sendMessage(MessageType.onClickSetResourcesDirectory)}
				title={translate().t("reactApp.settings.pickDirectoryOfExecutables")}
			>
				<DownloadIcon className="text-vscode-background" />
			</AKButton>
			<AKButton
				onClick={() => sendMessage(MessageType.openProjectResourcesDirectory, resourcesDir)}
				title={translate().t("reactApp.settings.openProjectResourcesDirectory")}
			>
				<div className="codicon codicon-folder-opened text-vscode-foreground"></div>
			</AKButton>
		</div>
	</div>
);
