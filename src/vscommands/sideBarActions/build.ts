import { SidebarController } from "@controllers";

export const buildProject = async (
	focusedItem: { contextValue?: string },
	sidebarController: SidebarController
) => {
	if (!focusedItem.contextValue) {
		return;
	}
	const projectId = focusedItem.contextValue;
	await sidebarController.buildProject(projectId);
};
