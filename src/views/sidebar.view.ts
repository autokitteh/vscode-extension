import { EventEmitter, TreeDataProvider, TreeItem, Event, TreeItemCollapsibleState, ThemeIcon } from "vscode";

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
	private isOrganizations: boolean = false;
	constructor(isOrganizations?: boolean) {
		this.isOrganizations = !!isOrganizations;
	}

	public setIsOrganizations(isOrganizations: boolean) {
		this.isOrganizations = isOrganizations;
	}

	async load(children: SidebarTreeItem[], organizationName?: string) {
		let childItems: TreeItem[] = [];

		if (!children.length) {
			this.rootNode = undefined;
			return;
		}

		const organizationNameToDisplay = organizationName ? `on ${organizationName} ` : "";

		this.rootNode = new TreeItem(
			`${translate().t("projects.projects")} ${organizationNameToDisplay}at ${this.strippedBaseURL}`,
			TreeItemCollapsibleState.Expanded
		);

		if (this.isOrganizations) {
			this.rootNode = new TreeItem(
				translate().t("organizations.pickOrganization", { hostUrl: this.strippedBaseURL }),
				TreeItemCollapsibleState.Expanded
			);
		}

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
			const title = this.isOrganizations
				? translate().t("organizations.openOrganizationName", { name: element.label })
				: translate().t("projects.openProject", { name: element.label });
			const command = this.isOrganizations ? vsCommands.openOrganization : vsCommands.openWebview;
			element.command = {
				command,
				title,
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

	refresh(children: SidebarTreeItem[], organizationName?: string) {
		this.load(children, organizationName);
		this._onDidChangeTreeData.fire();
	}

	displayError(error: string) {
		const errorItem = new TreeItem(error, TreeItemCollapsibleState.None);
		errorItem.contextValue = "error";
		errorItem.iconPath = new ThemeIcon("error");

		this.rootNode = errorItem;
		this.childNodeMap = new Map();
		this._onDidChangeTreeData.fire();
	}

	public dispose() {
		this._onDidChangeTreeData.dispose();
	}
}
