import * as vscode from "vscode";

export class DebounceManager {
	private timers = new Map<string, NodeJS.Timeout>();
	private pendingSaves = new Set<string>();
	private readonly maxConcurrency: number;

	constructor(maxConcurrency: number = 10) {
		this.maxConcurrency = maxConcurrency;
	}

	schedule(uri: vscode.Uri, delayMs: number, fn: () => Promise<void>): void {
		const key = uri.toString();
		this.cancel(uri);

		const timer = setTimeout(async () => {
			if (this.pendingSaves.size >= this.maxConcurrency) {
				this.schedule(uri, delayMs, fn);
				return;
			}

			this.pendingSaves.add(key);
			this.timers.delete(key);

			try {
				await fn();
			} finally {
				this.pendingSaves.delete(key);
			}
		}, delayMs);

		this.timers.set(key, timer);
	}

	cancel(uri: vscode.Uri): void {
		const key = uri.toString();
		const timer = this.timers.get(key);
		if (timer) {
			clearTimeout(timer);
			this.timers.delete(key);
		}
	}

	async flushAll(): Promise<void> {
		const pending = Array.from(this.timers.keys());
		for (const key of pending) {
			const timer = this.timers.get(key);
			if (timer) {
				clearTimeout(timer);
			}
		}
		this.timers.clear();

		while (this.pendingSaves.size > 0) {
			await new Promise((resolve) => setTimeout(resolve, 50));
		}
	}

	hasPending(uri: vscode.Uri): boolean {
		const key = uri.toString();
		return this.timers.has(key) || this.pendingSaves.has(key);
	}

	dispose(): void {
		for (const timer of this.timers.values()) {
			clearTimeout(timer);
		}
		this.timers.clear();
		this.pendingSaves.clear();
	}
}
