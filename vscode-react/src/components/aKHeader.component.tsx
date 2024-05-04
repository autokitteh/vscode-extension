import { useEffect, useRef, useState } from "react";
import { MessageType, Theme } from "@enums";
import { translate } from "@i18n";
import DownloadIcon from "@react-assets/icons/download.svg?react";
import { AKButton, AKLogo, AKOverlay, ProjectSettingsPopper, PopperComponent } from "@react-components";
import { useAppDispatch, useAppState } from "@react-context/appState.context";
import { useIncomingMessageHandler } from "@react-hooks";
import { sendMessage } from "@react-utilities";
import "split-pane-react/esm/themes/default.css";

export const AKHeader = () => {
	const [projectName, setProjectName] = useState<string>();
	const [themeVisualType, setThemeVisualType] = useState<Theme | undefined>();
	const [resourcesDir, setResourcesDir] = useState<string>("");
	const [settingsPopperVisible, setSettingsPopperVisible] = useState<boolean>(false);
	const pathPopperElementRef = useRef<HTMLDivElement | null>(null);

	const { stopLoader, startLoader } = useAppDispatch();

	useIncomingMessageHandler({
		handleResponse: stopLoader,
	});

	useIncomingMessageHandler({
		setProjectName,
		setThemeVisualType,
		setResourcesDir,
	});

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_, dispatch] = useAppState();

	useEffect(() => {
		if (projectName) {
			stopLoader(MessageType.openProjectInNewWindow);
		}
	}, [projectName]);

	const initAction = (action: MessageType) => {
		sendMessage(action);
		startLoader(action);
	};

	return (
		<div className="flex items-center w-full">
			<AKLogo className="w-9 h-9 m-2" themeVisualType={themeVisualType} />
			<div className="text-vscode-input-foreground font-bold text-lg">{projectName}</div>
			<AKButton
				classes="mx-4"
				onClick={() => initAction(MessageType.buildProject)}
				disabled={!resourcesDir}
				title={translate().t("reactApp.general.build")}
			>
				<div className="codicon codicon-tools mr-2"></div>
				{translate().t("reactApp.general.build")}
			</AKButton>
			<AKButton
				onClick={() => initAction(MessageType.runProject)}
				disabled={!resourcesDir}
				title={translate().t("reactApp.general.deploy")}
			>
				<div className="codicon codicon-rocket mr-2"></div>
				{translate().t("reactApp.general.deploy")}
			</AKButton>
			<div className="flex-grow"></div>
			<div className="flex-col">
				{!resourcesDir ? (
					<AKButton
						onClick={() => sendMessage(MessageType.onClickSetResourcesDirectory)}
						classes="flex relative z-30"
						title={translate().t("reactApp.settings.pickDirectoryOfExecutables")}
					>
						<DownloadIcon className="text-vscode-background" />
					</AKButton>
				) : (
					<AKButton
						onClick={() => setSettingsPopperVisible(true)}
						title={translate().t("reactApp.settings.viewProjectSettings")}
					>
						<div className="codicon codicon-gear text-vscode-background" ref={pathPopperElementRef}></div>
					</AKButton>
				)}
				<AKOverlay isVisibile={settingsPopperVisible} onOverlayClick={() => setSettingsPopperVisible(false)} />

				<PopperComponent visible={settingsPopperVisible} referenceRef={pathPopperElementRef}>
					<ProjectSettingsPopper resourcesDir={resourcesDir} closePopper={() => setSettingsPopperVisible(false)} />
				</PopperComponent>
			</div>
		</div>
	);
};
