import { Trigger as ProtoTrigger } from "@ak-proto-ts/triggers/v1/trigger_pb";
import { Trigger } from "@type/models";

export const convertTriggerProtoToModel = (protoTrigger: ProtoTrigger): Trigger => {
	return {
		triggerId: protoTrigger.triggerId,
		name: protoTrigger.codeLocation!.name,
		path: protoTrigger.codeLocation!.path,
	};
};
