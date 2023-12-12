import { EventEmitter, TreeDataProvider, TreeItem, Event, TreeItemCollapsibleState } from "vscode";

export class MyTreeStrProvider implements TreeDataProvider<TreeItem> {
	private _onDidChangeTreeData: EventEmitter<TreeItem | undefined | void> = new EventEmitter<
		TreeItem | undefined | void
	>();
	readonly onDidChangeTreeData: Event<TreeItem | undefined | void> =
		this._onDidChangeTreeData.event;

	private rootNode: TreeItem;
	private childNodeMap: Map<TreeItem, TreeItem[]>;

	constructor(childrenStrArray: string[]) {
		// Set the rootNode to be collapsible
		this.rootNode = new TreeItem("Projects", TreeItemCollapsibleState.Expanded);
		this.childNodeMap = new Map();

		// Create TreeItems for children and associate them with the root node
		const childItems = childrenStrArray.map((childStr) => new TreeItem(childStr));
		this.childNodeMap.set(this.rootNode, childItems);
	}

	getTreeItem(element: TreeItem): TreeItem {
		if (element !== this.rootNode) {
			element.command = {
				command: "autokitteh.openWebview",
				title: "Open project",
				// Pass the label or any other data you need from the element object
				arguments: [element.label],
			};
		}
		return element;
	}

	getChildren(element?: TreeItem): Thenable<TreeItem[]> {
		if (element) {
			// Return children of the given element
			return Promise.resolve(this.childNodeMap.get(element) || []);
		} else {
			// If no element is provided, return the root node
			return Promise.resolve([this.rootNode]);
		}
	}

	refresh() {
		this._onDidChangeTreeData.fire();
	}
}
