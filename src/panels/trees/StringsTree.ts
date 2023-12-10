import * as vscode from "vscode";
import { TreeItem } from "vscode";

export class MyTreeStrProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | void> =
        new vscode.EventEmitter<TreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | void> =
        this._onDidChangeTreeData.event;

    private rootNode: TreeItem;
    private childNodeMap: Map<TreeItem, TreeItem[]>;

    constructor(childrenStrArray: string[]) {
        // Set the rootNode to be collapsible
        this.rootNode = new TreeItem("Projects", vscode.TreeItemCollapsibleState.Expanded);
        this.childNodeMap = new Map();

        // Create TreeItems for children and associate them with the root node
        const childItems = childrenStrArray.map(childStr => new TreeItem(childStr));
        this.childNodeMap.set(this.rootNode, childItems);
    }

    getTreeItem(element: TreeItem): vscode.TreeItem {
        if (element !== this.rootNode) {
            element.command = {
                command: 'myExtension.myCommand',
                title: 'Test',
                arguments: [element.label] // Pass the label or any other data you need
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
