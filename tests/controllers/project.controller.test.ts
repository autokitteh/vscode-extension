import { vsCommands } from "@constants";
import { ProjectController } from "@controllers/project.controller";
import { translate } from "@i18n";
import { IProjectView } from "@interfaces";
import { mockViewInterface } from "@tests/mocks";
import sinon, { SinonStub } from "sinon";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as vscode from "vscode";

describe("ProjectController", () => {
	let projectController: ProjectController;
	let mockView: IProjectView;
	let executeCommandStub: SinonStub;

	beforeEach(() => {
		mockViewInterface.reveal = sinon.stub();
		executeCommandStub = sinon.stub(vscode.commands, "executeCommand");

		mockView = mockViewInterface;

		projectController = new ProjectController(mockView, "project-id", 1000);
	});

	afterEach(() => {
		sinon.restore();
	});

	it("should call view.reveal with project name if project exists", () => {
		projectController.project = { name: "Test Project", projectId: "project-id1" };
		projectController.reveal();
		expect((mockView.reveal as SinonStub).calledWith("Test Project")).toBe(true);
	});

	it("should call vscode command with error message if project is undefined", () => {
		projectController.project = undefined;
		projectController.reveal();
		expect(
			executeCommandStub.calledWith(
				vsCommands.showErrorMessage,
				translate().t("errors.unexpectedError")
			)
		).toBe(true);
	});
});
