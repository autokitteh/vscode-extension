import { vsCommands } from "@constants";
import { translate } from "@i18n";
import { SidebarTreeItem } from "@type/views";
import { EventEmitter, TreeDataProvider, TreeItem, Event, TreeItemCollapsibleState } from "vscode";

export class SidebarView implements TreeDataProvider<TreeItem> {
	private _onDidChangeTreeData: EventEmitter<TreeItem | undefined | void> = new EventEmitter<
		TreeItem | undefined | void
	>();
	readonly onDidChangeTreeData: Event<TreeItem | undefined | void> = this._onDidChangeTreeData.event;

	private rootNode?: TreeItem;
	private childNodeMap?: Map<TreeItem, TreeItem[]>;

	constructor() {}

	load(children: SidebarTreeItem[]) {
		if (!children.length) {
			this.rootNode = undefined;
			return;
		}
		this.rootNode = new TreeItem(translate().t("projects.projects"), TreeItemCollapsibleState.Expanded);
		this.childNodeMap = new Map();

		if (children.length === 1 && children[0].key === undefined) {
			this.rootNode = new TreeItem(children[0].label, TreeItemCollapsibleState.None);
			this.childNodeMap.set(this.rootNode, []);
			return;
		}

		const childItems = children.map((child: SidebarTreeItem) => {
			const treeItem = new TreeItem(child.label);
			treeItem.contextValue = child.key;
			return treeItem;
		});

		this.childNodeMap.set(this.rootNode, childItems);
	}

	getTreeItem(element: TreeItem): TreeItem {
		if (element !== this.rootNode || element.contextValue === undefined) {
			element.command = {
				command: vsCommands.openWebview,
				title: translate().t("projects.openProject"),
				arguments: [{ label: element.label, key: element.contextValue }],
			};
		}
		return element;
	}

	getChildren(element?: TreeItem): Thenable<TreeItem[] | undefined> {
		if (element && this.childNodeMap) {
			return Promise.resolve(this.childNodeMap.get(element) || []);
		} else {
			if (this.rootNode) {
				return Promise.resolve([this.rootNode]);
			} else {
				return Promise.resolve([]);
			}
		}
	}

	refresh(children: SidebarTreeItem[]) {
		this.load(children);
		this._onDidChangeTreeData.fire();
	}
}
