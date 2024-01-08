import { ISessionView } from "@interfaces";

export class SessionController {
	private view: ISessionView;

	constructor(projectView: ISessionView) {
		this.view = projectView;
	}

	public async showSessionLog(sessionLogs: Array<string>) {
		this.view.show(sessionLogs);
	}
}
