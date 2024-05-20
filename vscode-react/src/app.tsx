import { useEffect, useRef, useState } from "react";
import retryLoader from "@assets/animations/retry-loader.json";
import { MessageType } from "@enums";
import { Overlay } from "@react-components/atoms";
import { DeploymentsSection } from "@react-components/deployments/pages";
import { Header } from "@react-components/organisms";
import { SessionsSection } from "@react-components/sessions/pages";
import { AppStateProvider } from "@react-context";
import { useIncomingMessageHandler } from "@react-hooks";
import { sendMessage } from "@react-utilities";
import LottieLoader from "react-lottie-loader";
import "./app.css";
import SplitPane from "split-pane-react";
import "split-pane-react/esm/themes/default.css";

function App() {
	const [sizes, setSizes] = useState<(number | string)[]>([]);
	const [retryCountdown, setRetryCountdown] = useState<string>("");

	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (ref.current) {
			setSizes([ref.current.clientHeight * 0.48, ref.current.clientHeight * 0.48]);
		}
	}, []);

	useIncomingMessageHandler({
		setRetryCountdown,
	});

	const reconnect = () => {
		sendMessage(MessageType.tryToReenable);
	};

	const overlayClass = "relative flex flex-col w-[100vw] h-[100vh] text-4xl justify-center items-center z-50";

	return (
		<AppStateProvider>
			<main ref={ref}>
				{retryCountdown ? (
					<div className="absolute" onClick={() => reconnect()}>
						<Overlay isVisibile className="opacity-65 z-40!" />
						<div className={overlayClass}>
							<div className="flex">
								<LottieLoader animationData={retryLoader} className="w-64 h-64" />
							</div>
							<div className="flex text-white font-light text-sm">Reconnecting in {retryCountdown}</div>
							<div className="flex text-white text-sm">Retry Now</div>
						</div>
					</div>
				) : null}

				<div className="flex flex-col w-full">
					<Header />
					<div className="h-[calc(100vh-6vh)]">
						<SplitPane
							split="horizontal"
							sizes={sizes}
							onChange={setSizes}
							sashRender={() => <hr className="bg-vscode-editor-background h-3" />}
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
		</AppStateProvider>
	);
}

export default App;
