import React, { memo, CSSProperties } from "react";
import { AKSessionState, AKSessionActions, AKOverlay, PopperComponent, DeletePopper } from "@react-components";
import { AKTableCell, AKTableRow } from "@react-components/AKTable";
import { AKSessionsTableRowProps } from "@react-types";
import { getTimePassed } from "@react-utilities";
import { createPortal } from "react-dom";
import { areEqual } from "react-window";

export const AKSessionsTableRow = memo(
	({ data, index, style }: { data: AKSessionsTableRowProps; index: number; style: CSSProperties }) => {
		const {
			sessions,
			selectedSessionId,
			displaySessionLogs,
			sessionActions,
			modalName,
			hidePopper,
			isDeletingInProcess,
			deleteSessionConfirmed,
			deleteSessionDismissed,
			deleteSessionPopperTranslations,
			deletePopperElementRef,
		} = data;
		const session = sessions[index];
		const isSelectedRow = selectedSessionId === session?.sessionId;
		return (
			session && (
				<AKTableRow className="flex justify-around" isSelected={isSelectedRow} style={style}>
					<div className="absolute inset-0 cursor-pointer" onClick={() => displaySessionLogs(session.sessionId)} />
					<AKTableCell classes={["cursor-pointer w-64"]}>{getTimePassed(session.createdAt)}</AKTableCell>
					<AKTableCell classes={["cursor-pointer w-32"]}>
						<AKSessionState sessionState={session.state} />
					</AKTableCell>
					<AKTableCell classes={["cursor-pointer w-64"]}>{session.sessionId}</AKTableCell>
					<AKTableCell classes={["w-32 z-10"]}>
						<AKSessionActions session={session} {...sessionActions} />
						{createPortal(
							<div>
								<AKOverlay
									isVisibile={modalName === "sessionDelete" && index === 0}
									onOverlayClick={() => hidePopper()}
								/>

								<PopperComponent visible={modalName === "sessionDelete"} referenceRef={deletePopperElementRef}>
									<DeletePopper
										isDeletingInProcess={isDeletingInProcess}
										onConfirm={() => deleteSessionConfirmed()}
										onDismiss={() => deleteSessionDismissed()}
										translations={deleteSessionPopperTranslations}
									/>
								</PopperComponent>
							</div>,
							document.body
						)}
					</AKTableCell>
				</AKTableRow>
			)
		);
	},
	areEqual
);
