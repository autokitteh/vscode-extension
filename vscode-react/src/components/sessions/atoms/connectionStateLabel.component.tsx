import React, { ReactNode } from "react";
import { translate } from "@i18n";
import { ConnectionStatus } from "@type/models";

export const ConnectionStateLabel = ({ connectionStatus }: { connectionStatus: ConnectionStatus }): ReactNode => {
	const textColor: Record<ConnectionStatus, string> = {
		warning: "text-yellow-500",
		error: "text-red-500",
		ok: "text-green-500",
	};

	return (
		<div className={textColor[connectionStatus]}>
			{translate().t(`reactApp.connections.statuses.${connectionStatus}`)}
		</div>
	);
};
