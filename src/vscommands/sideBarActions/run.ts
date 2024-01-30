import { SidebarController } from "@controllers";

export const runProject = async (focusedItem: { contextValue?: string }, sidebarController: SidebarController) => {
	if (!focusedItem.contextValue) {
		return;
	}
	const projectId = focusedItem.contextValue;
	await sidebarController.runProject(projectId);
};
