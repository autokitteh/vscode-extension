const packageJson = require('./package.json');
const { execSync } = require('child_process');
const fs = require('fs');

const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
packageJson.version += `-${commitHash}`;

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log(`\n\n\nUpdated hashed version in package.json to: \n${packageJson.version}\n\n\n`);