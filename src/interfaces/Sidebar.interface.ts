import { TreeDataProvider, TreeItem } from "vscode";

export interface ISidebarViewDelegate {
	onClose?: Callback;
	build: Callback;
	deploy: Callback;
}

export interface ISidebarView extends TreeDataProvider<TreeItem> {
	refresh(): void;
	load(children: SidebarTreeItem[]): void;
	delegate?: ISidebarViewDelegate;
}
