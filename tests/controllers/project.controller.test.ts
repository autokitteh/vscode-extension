import { vsCommands } from "@constants";
import { ProjectController } from "@controllers/project.controller";
import { translate } from "@i18n";
import { IProjectView } from "@interfaces";
import { get } from "lodash";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { commands } from "vscode";

describe("ProjectController", () => {
	let projectController: ProjectController;
	let mockView: IProjectView;

	beforeEach(() => {
		// Assuming IProjectView has a reveal method
		mockView = {
			reveal: vi.fn(),
			delegate: {
				build: vi.fn(),
				run: vi.fn(),
				setDeploymentsPageSize: vi.fn(),
			},
			update: vi.fn(),
			show: vi.fn(),
			dispose: vi.fn(),
		} as IProjectView;
		projectController = new ProjectController(mockView, "project-id", 1000);
		vi.mock("vscode", () => {
			return {
				workspace: {
					getConfiguration: vi.fn(() => {
						return {
							get: vi.fn((key: string) => {
								if (key === "autokitteh.baseURL") {
									return "http://mocked.url"; // Your mocked value
								}
								// Handle other configuration keys if needed
							}),
						};
					}),
				},
				commands: {
					executeCommand: vi.fn(),
				},
			};
		});
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
