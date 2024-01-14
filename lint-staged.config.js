/* eslint-disable unicorn/filename-case */
module.exports = {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	"*.{ts,tsx}": (filenames) => ["npm run format:fix", "npm run validate"],
};
