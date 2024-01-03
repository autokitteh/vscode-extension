/* eslint-disable import/order */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { vscodeMock, mockViewInterface } from "@tests/mocks";
import { vsCommands } from "@constants";
import { ProjectController } from "@controllers/project.controller";
import { translate } from "@i18n";
import { IProjectView } from "@interfaces";
import { commands } from "vscode";
vi.mock("vscode", () => vscodeMock);

describe("ProjectController", () => {
	let projectController: ProjectController;
	let mockView: IProjectView;

	beforeEach(() => {
		mockView = mockViewInterface;
		projectController = new ProjectController(mockView, "project-id", 1000);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should call view.reveal with project name if project exists", () => {
		projectController.project = { name: "Test Project", projectId: "project-id1" };
		projectController.reveal();
		expect(mockView.reveal).toHaveBeenCalledWith("Test Project");
	});

	it("should call vscode command with error message if project is undefined", () => {
		const spy = vi.spyOn(commands, "executeCommand");
		projectController.project = undefined;
		projectController.reveal();
		expect(spy).toHaveBeenCalledWith(
			vsCommands.showErrorMessage,
			translate().t("errors.projectNameMissing")
		);
	});
});
