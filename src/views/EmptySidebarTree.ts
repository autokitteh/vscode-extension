import { TreeDataProvider, TreeItem } from "vscode";

export class EmptySidebarTree implements TreeDataProvider<TreeItem> {
	getTreeItem(element: TreeItem): TreeItem {
		return element;
	}

	getChildren(element?: TreeItem): Thenable<TreeItem[]> {
		return Promise.resolve([]);
	}
}
