import { MessageType } from "@enums";
import retryLoader from "@react-assets/animations/retry-loader.json";
import { Overlay } from "@react-components/atoms";
import { DeploymentsSection } from "@react-components/deployments/pages";
import { Header } from "@react-components/organisms";
import { SessionsSection } from "@react-components/sessions/pages";
import { AppStateProvider } from "@react-context";
import { useIncomingMessageHandler } from "@react-hooks";
import { sendMessage } from "@react-utilities";
import { useEffect, useMemo, useRef, useState } from "react";
import LottieLoader from "react-lottie-loader";
import SplitPane from "split-pane-react";

import "./app.css";

import "split-pane-react/esm/themes/default.css";
import { SessionLogView } from "@react-components/sessions/organisms";

function App() {
	const [sizes, setSizes] = useState<(number | string)[]>([]);
	const [retryCountdown, setRetryCountdown] = useState<string>("");

	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (ref.current) {
			setSizes([ref.current.clientHeight * 0.48, ref.current.clientHeight * 0.48]);
		}
	}, []);

	const handlers = useMemo(() => ({ setRetryCountdown }), []); // setState is stable

	useIncomingMessageHandler(handlers);

	const reconnect = () => {
		sendMessage(MessageType.tryToReconnect);
	};

	const overlayClass = "relative flex flex-col w-[100vw] h-[100vh] text-4xl justify-center items-center z-50";

	return (
		<AppStateProvider>
			<main ref={ref}>
				{retryCountdown ? (
					<div className="absolute" onClick={() => reconnect()}>
						<Overlay className="z-40 opacity-65" isVisibile />
						<div className={overlayClass}>
							<div className="flex">
								<LottieLoader animationData={retryLoader} className="size-48" />
							</div>
							<div className="flex text-sm font-light text-white">{retryCountdown}</div>
							<div className="flex text-sm text-white">Retry Now</div>
						</div>
					</div>
				) : null}
				<div className="flex w-full flex-col">
					<Header />
					<div className="h-[calc(100vh-6vh)]">
						{/* eslint-disable tailwindcss/classnames-order */}
						<SplitPane
							onChange={setSizes}
							sashRender={() => <hr className="bg-vscode-editor-background h-3" />}
							sizes={sizes}
							split="horizontal"
						>
							<div>
								<DeploymentsSection height={sizes[0]} />
							</div>
							<div>
								<SessionsSection height={sizes[1]} />
							</div>
						</SplitPane>
					</div>
				</div>
			</main>
			<SessionLogView />
		</AppStateProvider>
	);
}

export default App;
