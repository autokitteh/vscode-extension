const fs = require("fs");

const packageJsonPath = "./package.json";
const packageJson = require(packageJsonPath);

function getStringUntilLastHyphen(str) {
	const lastHyphenIndex = str.lastIndexOf("-");
	// If there's no hyphen, return the original string
	if (lastHyphenIndex === -1) {
		return str;
	}
	return str.substring(0, lastHyphenIndex);
}

let versionComponents = getStringUntilLastHyphen(packageJson.version);

if (versionComponents.length) {
	packageJson.version = versionComponents;
	fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
	console.log(`Updated base version in package.json back to:${packageJson.version}`);
	return;
}

throw new Error(
	"Invalid version format in package.json. " +
		"The version field is either empty or not properly formatted. Expected format: 'x.y.z-hash'."
);
