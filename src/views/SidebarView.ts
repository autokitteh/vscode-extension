import { CONNECT_TO_AUTOKITTEH, OPEN_PROJECT_WEBVIEW } from "@constants";
import {
	EventEmitter,
	TreeDataProvider,
	TreeItem,
	Event,
	TreeItemCollapsibleState,
	workspace,
} from "vscode";

export class TreeProvider implements TreeDataProvider<TreeItem> {
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
		const isConnected = workspace.getConfiguration().get("autokitteh.serviceEnabled");
		if (element !== this.rootNode) {
			element.command = {
				command: isConnected ? OPEN_PROJECT_WEBVIEW : CONNECT_TO_AUTOKITTEH,
				title: "Open project",
				arguments: [element.label],
			};
		}
		return element;
	}

	getChildren(element?: TreeItem): Thenable<TreeItem[]> {
		if (element) {
			return Promise.resolve(this.childNodeMap.get(element) || []);
		} else {
			return Promise.resolve([this.rootNode]);
		}
	}

	refresh() {
		this._onDidChangeTreeData.fire();
	}
}
