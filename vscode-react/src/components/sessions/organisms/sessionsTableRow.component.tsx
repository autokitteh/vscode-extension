import React, { memo, CSSProperties } from "react";
import { Overlay } from "@react-components/atoms";
import { Cell } from "@react-components/atoms/table";
import { DeletePopper, Popper, Row } from "@react-components/molecules";
import { SessionStateLabel } from "@react-components/sessions/atoms";
import { SessionActions } from "@react-components/sessions/molecules";
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
				<Row className="flex justify-around" isSelected={isSelectedRow} style={style}>
					<div className="absolute inset-0 cursor-pointer" onClick={() => displaySessionLogs(session.sessionId)} />
					<Cell classes={["cursor-pointer w-64"]}>{getTimePassed(session.createdAt)}</Cell>
					<Cell classes={["cursor-pointer w-32"]}>
						<SessionStateLabel sessionState={session.state} />
					</Cell>
					<Cell classes={["cursor-pointer w-64"]}>{session.sessionId}</Cell>
					<Cell classes={["w-32 z-10 flex justify-center"]}>
						<SessionActions session={session} {...sessionActions} />
						{createPortal(
							<div>
								<Overlay
									isVisibile={modalName === "sessionDelete" && index === 0}
									onOverlayClick={() => hidePopper()}
								/>

								<Popper visible={modalName === "sessionDelete"} referenceRef={deletePopperElementRef}>
									<DeletePopper
										onConfirm={() => deleteSessionConfirmed()}
										onDismiss={() => deleteSessionDismissed()}
										translations={deleteSessionPopperTranslations}
									/>
								</Popper>
							</div>,
							document.body
						)}
					</Cell>
				</Row>
			)
		);
	},
	areEqual
);
