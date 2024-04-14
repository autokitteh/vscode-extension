import { useEffect, useRef, useState } from "react";
import { MessageType, Theme } from "@enums";
import { translate } from "@i18n";
import { Player } from "@lottiefiles/react-lottie-player";
import DownloadIcon from "@react-assets/icons/download.svg?react";
import loaderAnimation from "@react-assets/media/catto-loader.json";
import { AKButton, AKLogo, AKOverlay, ProjectSettingsPopper, PopperComponent } from "@react-components";
import { AppStateProvider } from "@react-context";
import { useIncomingMessageHandler } from "@react-hooks";
import { AKDeployments, AKSessions } from "@react-sections";
import { sendMessage } from "@react-utilities";
import "./app.css";

function App() {
	const [projectName, setProjectName] = useState<string | undefined>();
	const [themeVisualType, setThemeVisualType] = useState<Theme | undefined>();
	const [resourcesDir, setResourcesDir] = useState<string>("");
	const [pathResponse, setPathResponse] = useState<boolean>(false);
	const [resourcesDirPopperVisible, setResourcesDirPopperVisible] = useState<boolean>(false);
	const pathPopperElementRef = useRef<HTMLDivElement | null>(null);

	useIncomingMessageHandler({
		setProjectName,
		setThemeVisualType,
		setResourcesDir,
		setPathResponse,
	});

	useEffect(() => {
		setResourcesDirPopperVisible(false);
	}, [pathResponse, resourcesDir]);

	return (
		<main>
			{!!projectName ? (
				<div className="flex flex-col w-full">
					<div className="flex items-center w-full">
						<AKLogo className="w-12 h-12" themeVisualType={themeVisualType} />
						<div className="text-vscode-input-foreground font-bold ml-4 text-lg">{projectName}</div>
						<AKButton
							classes="mx-4"
							onClick={() => sendMessage(MessageType.buildProject)}
							disabled={!resourcesDir}
							title={translate().t("reactApp.general.build")}
						>
							<div className="codicon codicon-tools mr-2"></div>
							{translate().t("reactApp.general.build")}
						</AKButton>
						<AKButton
							onClick={() => sendMessage(MessageType.runProject)}
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
									onClick={() => setResourcesDirPopperVisible(true)}
									title={translate().t("reactApp.settings.viewProjectResourcesDirectory")}
								>
									<div className="codicon codicon-gear text-vscode-background" ref={pathPopperElementRef}></div>
								</AKButton>
							)}
							<AKOverlay
								isVisibile={resourcesDirPopperVisible}
								onOverlayClick={() => setResourcesDirPopperVisible(false)}
							/>

							<PopperComponent visible={resourcesDirPopperVisible} referenceRef={pathPopperElementRef}>
								<ProjectSettingsPopper resourcesDir={resourcesDir} />
							</PopperComponent>
						</div>
					</div>
					<AppStateProvider>
						<AKDeployments />
						<AKSessions />
					</AppStateProvider>
				</div>
			) : (
				<div className="flex justify-center items-center h-screen w-screen">
					<Player src={loaderAnimation} className="player" loop autoplay />
				</div>
			)}
		</main>
	);
}

export default App;
