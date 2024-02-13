import { Socket, connect } from "net";
import { namespaces } from "@constants";
import { LoggerService } from "@services";
import { StreamInfo } from "vscode-languageclient";

export class NetworkClient {
	private retryTimer: NodeJS.Timeout | undefined;
	private connecting: boolean = false;
	private isConnected: boolean = false;
	private socket: Socket | null = null;
	private retryCount: number = 0;
	private maxRetries: number = 100;

	public async startServer(host: string, port: number): Promise<StreamInfo> {
		return new Promise<StreamInfo>((resolve, reject) => {
			if (this.isConnected || this.retryCount >= this.maxRetries) {
				if (!this.isConnected) {
					reject(new Error("Failed to connect to the server after maximum retries."));
				}
				clearTimeout(this.retryTimer);
				return;
			}

			const connectToServer = () => {
				if (this.connecting) {
					return;
				}
				this.connecting = true;

				this.socket = connect({ port, host }, () => {
					LoggerService.info(namespaces.startlarkLSPServer, "Connected to LSP server");
					this.connecting = false;
					this.isConnected = true;

					resolve({
						reader: this.socket!,
						writer: this.socket!,
					});
				});

				this.socket.on("error", (error) => {
					this.isConnected = false;
					this.connecting = false;
					this.retryCount++;

					LoggerService.error(namespaces.startlarkLSPServer, "Connection error:" + error);
					this.connecting = false;
					clearTimeout(this.retryTimer);
					this.retryTimer = setTimeout(connectToServer, 5000);
				});

				this.socket.on("end", () => {
					this.connecting = false;
					this.isConnected = false;
				});

				this.socket.on("close", () => {
					LoggerService.info(namespaces.startlarkLSPServer, "Connection closed");
					this.connecting = false;
					this.isConnected = false;

					clearTimeout(this.retryTimer);
					this.retryTimer = setTimeout(connectToServer, 5000);
				});
			};
			connectToServer();
		});
	}

	closeConnection(): void {
		if (this.socket) {
			clearTimeout(this.retryTimer);

			this.socket.end();
			this.socket = null;
			this.isConnected = false;
			this.retryCount = 0;
			LoggerService.info("NetworkClient", "Manually closed connection to LSP server");
		}
	}
}
