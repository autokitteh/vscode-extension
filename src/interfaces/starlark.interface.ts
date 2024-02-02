export interface GitHubRelease {
	data: {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		tag_name: string;
		assets: Array<{
			name: string;
			// eslint-disable-next-line @typescript-eslint/naming-convention
			browser_download_url: string;
		}>;
	}[];
}

export interface AssetInfo {
	url: string;
	tag: string;
}
