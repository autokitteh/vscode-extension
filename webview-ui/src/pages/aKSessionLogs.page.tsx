import React from "react";
import { SessionLogViewModel } from "@models/views";

export const AKSessionLogs = ({ sessionLogs }: { sessionLogs: SessionLogViewModel }) => {
	return (
		<div>
			<div className="text-lg">Session Logs</div>
			<br />
			{sessionLogs.length === 0 && <div>No logs to display</div>}
			{sessionLogs.map((log, index) => (
				<div>{log}</div>
			))}
		</div>
	);
};

export default AKSessionLogs;
