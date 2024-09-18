/* eslint-disable @typescript-eslint/naming-convention */
/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				"black-semi-transparent": "rgba(0, 0, 0, 0.5)",
			},
		},
	},
	plugins: [require("@githubocto/tailwind-vscode")],
};
