import { Value } from "@ak-proto-ts/values/v1/values_pb";
import { translate } from "@i18n";

export function convertErrorProtoToModel(
	protoValue?: Value,
	defaultError: string = translate().t("errors.errorOccured")
): Error {
	return new Error(protoValue?.string?.v || defaultError);
}
