/* eslint-disable @typescript-eslint/naming-convention */
/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				"black-semi-transparent": "rgba(0, 0, 0, 0.5)",
			},
			animation: {
				"spin-medium": "spin 4s linear infinite",
			},
		},
	},
	plugins: [require("@githubocto/tailwind-vscode")],
};
