import { Socket, connect } from "net";
import { StreamInfo } from "vscode-languageclient";

import { namespaces, starlarkLSPSocketReconnectRefreshRate } from "@constants";
import { translate } from "@i18n";
import { LoggerService } from "@services";

export class StarlarkSocketStreamingService {
	private static retryTimer: NodeJS.Timeout | undefined;
	private static connecting: boolean = false;
	private static socket: Socket | null = null;

	public static async getServerOptionsStreamInfo(host: string, port: number): Promise<StreamInfo> {
		return new Promise<StreamInfo>((resolve) => {
			const connectToServer = () => {
				if (this.connecting) {
					return;
				}
				this.connecting = true;

				this.socket = connect({ port, host }, () => {
					LoggerService.info(namespaces.startlarkLSPServer, translate().t("starlark.socketConnected"));
					clearTimeout(this.retryTimer);
					this.connecting = false;

					resolve({
						reader: this.socket!,
						writer: this.socket!,
					});
				});

				this.socket.on("error", (error) => {
					this.connecting = false;

					LoggerService.error(
						namespaces.startlarkLSPServer,
						translate().t("starlark.socketConnectionError", { error })
					);
					clearTimeout(this.retryTimer);
					this.retryTimer = setTimeout(connectToServer, starlarkLSPSocketReconnectRefreshRate);
				});

				this.socket.on("end", () => {
					this.connecting = false;
				});

				this.socket.on("close", () => {
					LoggerService.info(namespaces.startlarkLSPServer, translate().t("starlark.socketConnectionClosed"));
					this.connecting = false;

					clearTimeout(this.retryTimer);
					this.retryTimer = setTimeout(connectToServer, starlarkLSPSocketReconnectRefreshRate);
				});
			};
			connectToServer();
		});
	}

	public static closeConnection(): void {
		if (StarlarkSocketStreamingService.socket) {
			clearTimeout(StarlarkSocketStreamingService.retryTimer);

			StarlarkSocketStreamingService.socket.end();
			StarlarkSocketStreamingService.socket = null;
			LoggerService.info(namespaces.startlarkLSPServer, translate().t("starlark.socketManuallyClosed"));
		}
	}
}
