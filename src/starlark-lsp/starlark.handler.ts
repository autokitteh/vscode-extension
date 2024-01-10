import { CancellationToken, ProviderResult, TextDocumentContentProvider, Uri } from "vscode";
import { LanguageClient } from "vscode-languageclient";

const STARLARK_FILE_CONTENTS_METHOD = "starlark/fileContents";

class StarlarkFileContentsParams {
	constructor(public uri: String) {}
}

class StarlarkFileContentsResponse {
	constructor(public contents?: string | null) {}
}

export class StarlarkFileHandler implements TextDocumentContentProvider {
	private client: LanguageClient;
	constructor(client: LanguageClient) {
		this.client = client;
	}
	// eslint-disable-next-line @typescript-eslint/naming-convention
	provideTextDocumentContent(uri: Uri, _token: CancellationToken): ProviderResult<string> {
		if (this.client === undefined) {
			return null;
		}
		return this.client
			.sendRequest<StarlarkFileContentsResponse>(
				STARLARK_FILE_CONTENTS_METHOD,
				new StarlarkFileContentsParams(uri.toString())
			)
			.then((response: StarlarkFileContentsResponse) => {
				if (response.contents !== undefined && response.contents !== null) {
					return response.contents;
				} else {
					return null;
				}
			});
	}
}
