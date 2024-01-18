const fs = require('fs');

const packageJsonPath = './package.json';
const packageJson = require(packageJsonPath);

let versionComponents = packageJson.version.split('-');
if (versionComponents.length > 1) {
    packageJson.version = versionComponents[0];
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`Updated base version in package.json back to:${packageJson.version}`);
    return;
} 

throw new Error("Invalid version format in package.json. "+
    "The version field is either empty or not properly formatted. Expected format: 'x.y.z-hash'.");
