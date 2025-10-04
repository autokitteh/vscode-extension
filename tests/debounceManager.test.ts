import { describe, it, expect, beforeEach, vi } from "vitest";
import * as vscode from "vscode";

import { DebounceManager } from "../src/services/autoSave/debounceManager";

vi.mock("vscode");

describe("DebounceManager", () => {
	let manager: DebounceManager;
	let mockUri: vscode.Uri;

	beforeEach(() => {
		manager = new DebounceManager(2);
		mockUri = { toString: () => "file:///test.ts" } as vscode.Uri;
		vi.useFakeTimers();
	});

	it("should schedule a task", async () => {
		const fn = vi.fn();
		manager.schedule(mockUri, 100, fn);

		expect(fn).not.toHaveBeenCalled();
		vi.advanceTimersByTime(100);
		await vi.runAllTimersAsync();
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("should cancel a scheduled task", async () => {
		const fn = vi.fn();
		manager.schedule(mockUri, 100, fn);
		manager.cancel(mockUri);

		vi.advanceTimersByTime(100);
		await vi.runAllTimersAsync();
		expect(fn).not.toHaveBeenCalled();
	});

	it("should enforce at-most-one pending per document", async () => {
		const fn1 = vi.fn();
		const fn2 = vi.fn();

		manager.schedule(mockUri, 50, fn1);
		manager.schedule(mockUri, 100, fn2);

		vi.advanceTimersByTime(150);
		await vi.runAllTimersAsync();

		expect(fn1).not.toHaveBeenCalled();
		expect(fn2).toHaveBeenCalledTimes(1);
	});

	it("should respect max concurrency", async () => {
		const uri1 = { toString: () => "file:///test1.ts" } as vscode.Uri;
		const uri2 = { toString: () => "file:///test2.ts" } as vscode.Uri;
		const uri3 = { toString: () => "file:///test3.ts" } as vscode.Uri;

		const fn1 = vi.fn(async (): Promise<void> => {
			await new Promise<void>((resolve) => setTimeout(resolve, 200));
		});
		const fn2 = vi.fn(async (): Promise<void> => {
			await new Promise<void>((resolve) => setTimeout(resolve, 200));
		});
		const fn3 = vi.fn();

		manager.schedule(uri1, 10, fn1);
		manager.schedule(uri2, 10, fn2);
		manager.schedule(uri3, 10, fn3);

		vi.advanceTimersByTime(10);
		await vi.runAllTimersAsync();

		expect(fn1).toHaveBeenCalledTimes(1);
		expect(fn2).toHaveBeenCalledTimes(1);
	});

	it("should flush all pending tasks", async () => {
		const fn = vi.fn();
		manager.schedule(mockUri, 100, fn);

		await manager.flushAll();
		expect(fn).not.toHaveBeenCalled();
	});

	it("should dispose all timers", () => {
		const fn = vi.fn();
		manager.schedule(mockUri, 100, fn);

		manager.dispose();
		vi.advanceTimersByTime(100);

		expect(fn).not.toHaveBeenCalled();
	});
});
