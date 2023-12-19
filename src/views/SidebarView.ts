import { vsCommands } from "@constants";
import { translate } from "@i18n";
import { EventEmitter, TreeDataProvider, TreeItem, Event, TreeItemCollapsibleState } from "vscode";

export class TreeProvider implements TreeDataProvider<TreeItem> {
	private _onDidChangeTreeData: EventEmitter<TreeItem | undefined | void> = new EventEmitter<
		TreeItem | undefined | void
	>();
	readonly onDidChangeTreeData: Event<TreeItem | undefined | void> =
		this._onDidChangeTreeData.event;

	private rootNode: TreeItem;
	private childNodeMap: Map<TreeItem, TreeItem[]>;

	constructor(children: any) {
		this.rootNode = new TreeItem(
			translate().t("projects.projects"),
			TreeItemCollapsibleState.Expanded
		);
		this.childNodeMap = new Map();

		const childItems = children.map((child: { label: string; key: string }) => {
			const treeItem = new TreeItem(child.label);
			treeItem.contextValue = child.key; // Set the key as contextValue
			return treeItem;
		});

		this.childNodeMap.set(this.rootNode, childItems);
	}

	getTreeItem(element: TreeItem): TreeItem {
		if (element !== this.rootNode) {
			element.command = {
				command: vsCommands.openWebview,
				title: translate().t("projects.openProject"),
				arguments: [{ name: element.label, key: element.contextValue }],
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
