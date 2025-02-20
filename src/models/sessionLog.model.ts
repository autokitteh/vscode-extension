import moment from "moment";

import { GetPrintsResponse_Print as ProtoGetPrintsResponse_Print } from "@ak-proto-ts/sessions/v1/svc_pb";
import { DATE_TIME_FORMAT } from "@constants";
import { SessionOutputLog } from "@interfaces";
import { convertTimestampToDate } from "@utilities";

export function convertSessionLogProtoToModel(protoPrintLog?: ProtoGetPrintsResponse_Print): SessionOutputLog {
	const time = convertTimestampToDate(protoPrintLog?.t);
	const print = protoPrintLog?.v?.string?.v || "Empty print";
	const formattedDateTime = moment(time).local().format(DATE_TIME_FORMAT);

	return { time: formattedDateTime, print };
}
