import { ProjectController } from "@controllers";
import { IProjectView } from "@interfaces";
import { LoggerService } from "@services";
import { Project } from "@type/models";
import * as sinon from "sinon";
import { commands, window } from "vscode";

suite("ProjectController Test Suite", () => {
	let sandbox: sinon.SinonSandbox;
	let mockProjectView: Partial<IProjectView>;
	let projectController: ProjectController;

	suiteSetup(() => {
		sandbox = sinon.createSandbox();
		mockProjectView = {
			reveal: sandbox.spy(),
			update: sandbox.spy(),
		};
		projectController = new ProjectController(mockProjectView as IProjectView, "testProjectId", 1000, 1000);
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

	test("loadAndDisplayDeployments should update view with deployments", async () => {
		await projectController.loadAndDisplayDeployments();

		// Example: Assuming projectController has a 'deployments' property updated by the function
		const deployments = projectController.deployments;
		expect(deployments).toBeDefined();
		expect(deployments?.length).toBeGreaterThan(0);
	});

	setup(() => {
		sandbox.restore();
	});

	test("loadAndDisplayDeployments() should handle error correctly", async () => {
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
