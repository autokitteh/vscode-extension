import { translate } from "@i18n";
import { ConnectionStatus } from "@type/models";
import React, { ReactNode } from "react";

export const ConnectionStateLabel = ({ connectionStatus }: { connectionStatus: ConnectionStatus }): ReactNode => {
	const textColor: Record<ConnectionStatus, string> = {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		"": "",
		"error": "text-red-500",
		"ok": "text-green-500",
		"warning": "text-yellow-500",
	};

	return (
		<div className={textColor[connectionStatus]}>
			{translate().t(`reactApp.connections.statuses.${connectionStatus}`)}
		</div>
	);
};
