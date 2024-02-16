import { ProjectController } from "@controllers/project.controller";
import { IProjectView } from "@interfaces";
import { DeploymentsService, LoggerService } from "@services";
import { Project } from "@type/models";
import * as sinon from "sinon";
import { commands, window } from "vscode";

suite("ProjectController Test Suite", () => {
	let sandbox: sinon.SinonSandbox;
	let mockProjectView: Partial<IProjectView>;

	suiteSetup(() => {
		sandbox = sinon.createSandbox();
		mockProjectView = {
			reveal: sandbox.spy(),
			update: sandbox.spy(),
		};
	});

	suiteTeardown(() => {
		sandbox.restore();
		window.showInformationMessage("All tests done!");
	});

	test("reveal() should show project name if project is defined", () => {
		const controller = new ProjectController(mockProjectView as IProjectView, "project1", 1000, 1000);
		controller.project = { name: "Test Project", projectId: "project1" } as Project;

		controller.reveal();

		sinon.assert.calledWith(mockProjectView.reveal as sinon.SinonSpy, "Test Project");
	});

	test("loadAndDisplayDeployments() should handle error correctly", async () => {
		sandbox
			.stub(DeploymentsService, "listByProjectId")
			.resolves(new Promise((resolve) => resolve({ data: undefined, error: new Error("Mock error") })));
		sandbox.stub(commands, "executeCommand");
		sandbox.stub(LoggerService, "error");

		const controller = new ProjectController(mockProjectView as IProjectView, "project1", 1000, 1000);

		await controller.loadAndDisplayDeployments();

		sinon.assert.calledWith(LoggerService.error as sinon.SinonSpy, sinon.match.any, sinon.match.string);
		sinon.assert.calledWith(
			commands.executeCommand as sinon.SinonSpy,
			"autokitteh.showErrorMessage",
			sinon.match.string
		);
	});
});
