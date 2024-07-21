import { EventEmitter, TreeDataProvider, TreeItem, Event, TreeItemCollapsibleState } from "vscode";

import { BASE_URL, vsCommands } from "@constants";
import { translate } from "@i18n";
import { SidebarTreeItem } from "@type/views";

export class SidebarView implements TreeDataProvider<TreeItem> {
	private _onDidChangeTreeData: EventEmitter<TreeItem | undefined | void> = new EventEmitter<
		TreeItem | undefined | void
	>();
	readonly onDidChangeTreeData: Event<TreeItem | undefined | void> = this._onDidChangeTreeData.event;

	private rootNode?: TreeItem;
	private childNodeMap?: Map<TreeItem, TreeItem[]>;
	private strippedBaseURL = BASE_URL.replace(/^https?\:\/\/|\/$/g, "");

	constructor() {}

	load(children: SidebarTreeItem[]) {
		let childItems: TreeItem[] = [];

		if (!children.length) {
			this.rootNode = undefined;
			return;
		}
		this.rootNode = new TreeItem(
			`${translate().t("projects.projects")} on ${this.strippedBaseURL}`,
			TreeItemCollapsibleState.Expanded
		);
		this.childNodeMap = new Map();

		childItems = children.map((child: SidebarTreeItem) => {
			const treeItem = new TreeItem(child.label);
			treeItem.contextValue = child.key;
			return treeItem;
		});

		const isInvalidState = children.some((child) => child.key === undefined);

		if (isInvalidState) {
			this.rootNode = new TreeItem(children[0].label, TreeItemCollapsibleState.None);
			childItems = childItems.slice(1);
		}

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

	public dispose() {
		this._onDidChangeTreeData.dispose();
	}
}
