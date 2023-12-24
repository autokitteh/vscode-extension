import { TreeDataProvider, TreeItem } from "vscode";

export interface ISidebarView extends TreeDataProvider<TreeItem> {
	refresh(children: SidebarTreeItem[]): void;
	load(children: SidebarTreeItem[]): void;
}
