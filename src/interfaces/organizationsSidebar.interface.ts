import { TreeDataProvider, TreeItem } from "vscode";

import { SidebarTreeItem } from "@type/views";

export interface IOrganizationsSidebarView extends TreeDataProvider<TreeItem> {
	refresh(children: SidebarTreeItem[]): void;
	load(children: SidebarTreeItem[]): void;
}
