import { TreeDataProvider, TreeItem } from "vscode";

import { SidebarTreeItem } from "@type/views";

export interface ISidebarView extends TreeDataProvider<TreeItem> {
	refresh(children: SidebarTreeItem[], organizationId?: string, organizationName?: string): void;
	load(children: SidebarTreeItem[]): void;
}
