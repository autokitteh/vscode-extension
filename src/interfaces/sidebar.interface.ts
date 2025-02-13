import { TreeDataProvider, TreeItem } from "vscode";

import { SidebarTreeItem } from "@type/views";

export interface ISidebarView extends TreeDataProvider<TreeItem> {
	setIsOrganizations(isOrganizations: boolean): void;
	refresh(children: SidebarTreeItem[], organizationName?: string): void;
	displayError(errorMessage: string): void;
	load(children: SidebarTreeItem[]): void;
}
