/* eslint-disable unicorn/filename-case */
/* eslint-disable @typescript-eslint/naming-convention */
module.exports = {
	"**/*.{js,jsx,ts,tsx}": (filenames) => [
		"npm run check-types",
		`npm run lint -- ${filenames.join(" ")}`,
		`prettier --check ${filenames.join(" ")}`,
	],
};
