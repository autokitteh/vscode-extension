import React, { memo, CSSProperties } from "react";
import { SessionState, SessionActions, Overlay, PopperComponent, DeletePopper } from "@react-components";
import { TableCell, TableRow } from "@react-components/Table";
import { SessionsTableRowProps } from "@react-types";
import { getTimePassed } from "@react-utilities";
import { createPortal } from "react-dom";
import { areEqual } from "react-window";

export const SessionsTableRow = memo(
	({ data, index, style }: { data: SessionsTableRowProps; index: number; style: CSSProperties }) => {
		const {
			sessions,
			selectedSessionId,
			displaySessionLogs,
			sessionActions,
			modalName,
			hidePopper,
			deleteSessionConfirmed,
			deleteSessionDismissed,
			deleteSessionPopperTranslations,
			deletePopperElementRef,
		} = data;
		const session = sessions[index];
		const isSelectedRow = selectedSessionId === session?.sessionId;
		return (
			session && (
				<TableRow className="flex justify-around" isSelected={isSelectedRow} style={style}>
					<div className="absolute inset-0 cursor-pointer" onClick={() => displaySessionLogs(session.sessionId)} />
					<TableCell classes={["cursor-pointer w-64"]}>{getTimePassed(session.createdAt)}</TableCell>
					<TableCell classes={["cursor-pointer w-32"]}>
						<SessionState sessionState={session.state} />
					</TableCell>
					<TableCell classes={["cursor-pointer w-64"]}>{session.sessionId}</TableCell>
					<TableCell classes={["w-32 z-10 flex justify-center"]}>
						<SessionActions session={session} {...sessionActions} />
						{createPortal(
							<div>
								<Overlay
									isVisibile={modalName === "sessionDelete" && index === 0}
									onOverlayClick={() => hidePopper()}
								/>

								<PopperComponent visible={modalName === "sessionDelete"} referenceRef={deletePopperElementRef}>
									<DeletePopper
										onConfirm={() => deleteSessionConfirmed()}
										onDismiss={() => deleteSessionDismissed()}
										translations={deleteSessionPopperTranslations}
									/>
								</PopperComponent>
							</div>,
							document.body
						)}
					</TableCell>
				</TableRow>
			)
		);
	},
	areEqual
);
