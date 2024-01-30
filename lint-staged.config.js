/* eslint-disable unicorn/filename-case */
/* eslint-disable @typescript-eslint/naming-convention */
module.exports = {
	"**/*.{js,jsx,ts,tsx}": () => ["npm run check-types", "npm run fix-eslint:staged", "npm run check-format:staged"],
};
