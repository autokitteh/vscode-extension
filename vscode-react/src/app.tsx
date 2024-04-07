import { useState } from "react";
import { MessageType, Theme } from "@enums";
import { translate } from "@i18n";
import { Player } from "@lottiefiles/react-lottie-player";
import DownloadIcon from "@react-assets/icons/download.svg?react";
import loaderAnimation from "@react-assets/media/catto-loader.json";
import { AKButton, AKLogo } from "@react-components";
import { AppStateProvider } from "@react-context";
import { useIncomingMessageHandler } from "@react-hooks";
import { AKDeployments, AKSessions } from "@react-sections";
import { sendMessage } from "@react-utilities";
import "./app.css";
import { cn } from "@react-utilities/cnClasses.utils";

function App() {
	const [projectName, setProjectName] = useState<string | undefined>();
	const [themeVisualType, setThemeVisualType] = useState<Theme | undefined>();
	const [resourcesDir, setResourcesDir] = useState<string>("");

	useIncomingMessageHandler({
		setProjectName,
		setThemeVisualType,
		setResourcesDir,
	});

	return (
		<main>
			{!!projectName ? (
				<div className="flex flex-col w-full">
					<div className="flex items-center w-full">
						<AKLogo className="w-12 h-12" themeVisualType={themeVisualType} />
						<div className="text-vscode-input-foreground font-bold ml-4 text-lg">{projectName}</div>
						<AKButton classes="mx-4" onClick={() => sendMessage(MessageType.buildProject)} disabled={!resourcesDir}>
							<div className="codicon codicon-tools mr-2"></div>
							{translate().t("reactApp.general.build")}
						</AKButton>
						<AKButton onClick={() => sendMessage(MessageType.runProject)} disabled={!resourcesDir}>
							<div className="codicon codicon-rocket mr-2"></div>
							{translate().t("reactApp.general.deploy")}
						</AKButton>
						<div className="flex-grow"></div>
						<AKButton
							onClick={() => sendMessage(MessageType.onClickSetResourcesDirectory)}
							// eslint-disable-next-line @typescript-eslint/naming-convention
							classes={cn("bg-transparent border-0", { "bg-yellow-600": !resourcesDir })}
							title={translate().t("reactApp.settings.pickDirectoryOfExecutables")}
						>
							<DownloadIcon className="text-white" />
						</AKButton>
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
