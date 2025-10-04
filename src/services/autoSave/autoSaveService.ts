import { minimatch } from "minimatch";
import * as vscode from "vscode";

import { DebounceManager } from "./debounceManager";
import { ProjectMapper } from "./projectMapper";

type AutoSaveMode = "inherit" | "afterDelay" | "onFocusChange" | "onWindowChange";

export class AutoSaveService {
	private debounce: DebounceManager;
	private mapper: ProjectMapper;
	private statusBar: vscode.StatusBarItem;
	private outputChannel: vscode.OutputChannel;
	private disposables: vscode.Disposable[] = [];
	private notifiedReadonly = new Set<string>();
	private notifiedUntitled = new Set<string>();
	private notifiedLargeFile = new Set<string>();
	private externalChangeShown = new Set<string>();
	private willSaveTriggerCount = new Map<string, number>();
	private lastVersions = new Map<string, number>();

	constructor(
		debounce: DebounceManager,
		mapper: ProjectMapper,
		statusBar: vscode.StatusBarItem,
		outputChannel: vscode.OutputChannel
	) {
		this.debounce = debounce;
		this.mapper = mapper;
		this.statusBar = statusBar;
		this.outputChannel = outputChannel;
		this.statusBar.text = "$(check) Saved";
		this.statusBar.show();

		this.mapper.refreshFromConfig();
		this.registerEventHandlers();
	}

	private registerEventHandlers(): void {
		this.disposables.push(
			vscode.workspace.onDidChangeTextDocument((e) => this.onDidChangeTextDocument(e)),
			vscode.workspace.onWillSaveTextDocument((e) => this.onWillSaveTextDocument(e)),
			vscode.workspace.onDidSaveTextDocument((doc) => this.onDidSaveTextDocument(doc)),
			vscode.workspace.onDidRenameFiles((e) => this.onDidRenameFiles(e)),
			vscode.workspace.onDidChangeConfiguration((e) => this.onDidChangeConfiguration(e)),
			vscode.window.onDidChangeActiveTextEditor((editor) => this.onDidChangeActiveTextEditor(editor)),
			vscode.window.onDidChangeWindowState((state) => this.onDidChangeWindowState(state)),
			vscode.workspace.createFileSystemWatcher("**/*").onDidChange((uri) => this.onExternalChange(uri))
		);
	}

	private onDidChangeTextDocument(e: vscode.TextDocumentChangeEvent): void {
		if (!this.isEnabled() || e.contentChanges.length === 0) {
			return;
		}

		const doc = e.document;
		if (!this.shouldAutoSave(doc)) {
			return;
		}

		const mode = this.getMode();
		if (mode !== "afterDelay" && mode !== "inherit") {
			return;
		}

		const delayMs = this.getDelayMs();
		this.scheduleAutoSave(doc, delayMs);
	}

	private onWillSaveTextDocument(e: vscode.TextDocumentWillSaveEvent): void {
		const key = e.document.uri.toString();
		const currentVersion = e.document.version;
		const lastVersion = this.lastVersions.get(key);

		if (lastVersion !== undefined && currentVersion !== lastVersion) {
			const count = this.willSaveTriggerCount.get(key) || 0;
			if (count === 0) {
				this.willSaveTriggerCount.set(key, 1);
				this.lastVersions.set(key, currentVersion);
			} else {
				this.willSaveTriggerCount.delete(key);
			}
		} else {
			this.lastVersions.set(key, currentVersion);
		}
	}

	private onDidSaveTextDocument(doc: vscode.TextDocument): void {
		const key = doc.uri.toString();
		this.willSaveTriggerCount.delete(key);
		this.lastVersions.delete(key);
		this.updateStatusBar("saved");
	}

	private onDidRenameFiles(e: vscode.FileRenameEvent): void {
		for (const file of e.files) {
			this.debounce.cancel(file.oldUri);
			this.debounce.cancel(file.newUri);
		}
	}

	private onDidChangeConfiguration(e: vscode.ConfigurationChangeEvent): void {
		if (e.affectsConfiguration("autokitteh.autoSave") || e.affectsConfiguration("autokitteh.projectsPaths")) {
			this.mapper.refreshFromConfig();
		}

		if (e.affectsConfiguration("autokitteh.autoSave.enabled")) {
			if (!this.isEnabled()) {
				this.debounce.dispose();
			}
		}
	}

	private onDidChangeActiveTextEditor(editor: vscode.TextEditor | undefined): void {
		if (!this.isEnabled() || !editor) {
			return;
		}

		const mode = this.getMode();
		if (mode !== "onFocusChange" && mode !== "inherit") {
			return;
		}

		const doc = editor.document;
		if (this.shouldAutoSave(doc) && doc.isDirty) {
			this.performAutoSave(doc);
		}
	}

	private onDidChangeWindowState(state: vscode.WindowState): void {
		if (!this.isEnabled() || state.focused) {
			return;
		}

		const mode = this.getMode();
		if (mode !== "onWindowChange" && mode !== "inherit") {
			return;
		}

		const editor = vscode.window.activeTextEditor;
		if (editor && this.shouldAutoSave(editor.document) && editor.document.isDirty) {
			this.performAutoSave(editor.document);
		}
	}

	private async onExternalChange(uri: vscode.Uri): Promise<void> {
		const key = uri.toString();
		if (this.externalChangeShown.has(key)) {
			return;
		}

		const doc = vscode.workspace.textDocuments.find((d) => d.uri.toString() === key);
		if (!doc || !doc.isDirty) {
			return;
		}

		this.externalChangeShown.add(key);
		const choice = await vscode.window.showWarningMessage(
			`File ${uri.fsPath} was changed externally.`,
			"Reload",
			"Keep Mine",
			"Diff"
		);

		if (choice === "Reload") {
			await vscode.commands.executeCommand("workbench.action.files.revert");
		} else if (choice === "Diff") {
			await vscode.commands.executeCommand("workbench.files.action.compareWithSaved");
		}
	}

	private scheduleAutoSave(doc: vscode.TextDocument, delayMs: number): void {
		this.debounce.schedule(doc.uri, delayMs, async () => {
			await this.performAutoSave(doc);
		});
	}

	private async performAutoSave(doc: vscode.TextDocument): Promise<void> {
		if (!doc.isDirty) {
			return;
		}

		this.updateStatusBar("saving");

		try {
			await doc.save();
			this.updateStatusBar("saved");
		} catch (error) {
			this.updateStatusBar("failed");
			this.log(`Failed to save ${doc.uri.fsPath}: ${error}`);
		}
	}

	private shouldAutoSave(doc: vscode.TextDocument): boolean {
		if (doc.uri.scheme === "untitled") {
			this.notifyOnce(this.notifiedUntitled, doc.uri, "Untitled files are not auto-saved.");
			return false;
		}

		if (doc.uri.scheme !== "file") {
			return false;
		}

		if (!this.mapper.isInScope(doc.uri)) {
			return false;
		}

		const config = vscode.workspace.getConfiguration("autokitteh.autoSave", doc.uri);
		const includeGlobs = config.get<string[]>("includeGlobs", []);
		const excludeGlobs = config.get<string[]>("excludeGlobs", []);

		if (includeGlobs.length > 0) {
			const matched = includeGlobs.some((glob) => minimatch(doc.uri.fsPath, glob));
			if (!matched) {
				return false;
			}
		}

		if (excludeGlobs.length > 0) {
			const excluded = excludeGlobs.some((glob) => minimatch(doc.uri.fsPath, glob));
			if (excluded) {
				return false;
			}
		}

		const maxSizeKb = config.get<number>("maxFileSizeKb", 49);
		const sizeKb = Buffer.byteLength(doc.getText(), "utf8") / 1024;
		if (sizeKb > maxSizeKb) {
			this.notifyOnce(this.notifiedLargeFile, doc.uri, `File ${doc.uri.fsPath} exceeds ${maxSizeKb}KB and is skipped.`);
			return false;
		}

		return true;
	}

	private notifyOnce(cache: Set<string>, uri: vscode.Uri, message: string): void {
		const key = uri.toString();
		if (!cache.has(key)) {
			cache.add(key);
			vscode.window.showInformationMessage(message);
		}
	}

	private isEnabled(): boolean {
		if (!vscode.workspace.isTrusted) {
			return false;
		}

		const config = vscode.workspace.getConfiguration("autokitteh.autoSave");
		return config.get<boolean>("enabled", true);
	}

	private getMode(): AutoSaveMode {
		const config = vscode.workspace.getConfiguration("autokitteh.autoSave");
		return config.get<AutoSaveMode>("mode", "afterDelay");
	}

	private getDelayMs(): number {
		const config = vscode.workspace.getConfiguration("autokitteh.autoSave");
		return config.get<number>("delayMs", 750);
	}

	private updateStatusBar(state: "saving" | "saved" | "failed"): void {
		switch (state) {
			case "saving":
				this.statusBar.text = "$(sync~spin) Saving…";
				this.statusBar.tooltip = "Auto-saving file";
				break;
			case "saved":
				this.statusBar.text = "$(check) Saved";
				this.statusBar.tooltip = "File auto-saved successfully";
				break;
			case "failed":
				this.statusBar.text = "$(warning) Save failed";
				this.statusBar.tooltip = "Auto-save failed";
				break;
		}
	}

	private log(message: string): void {
		this.outputChannel.appendLine(`[AutoSave] ${message}`);
	}

	dispose(): void {
		this.debounce.dispose();
		this.statusBar.dispose();
		this.outputChannel.dispose();
		this.disposables.forEach((d) => d.dispose());
	}

	async cancelPending(): Promise<void> {
		this.debounce.dispose();
		this.log("All pending saves cancelled.");
	}

	async flushAll(): Promise<void> {
		await this.debounce.flushAll();
		this.log("All pending saves flushed.");
	}

	showLogs(): void {
		this.outputChannel.show();
	}
}
