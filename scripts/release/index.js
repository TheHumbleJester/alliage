const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pkg = require('../../package.json');

const BASE_DIR = path.resolve(`${__dirname}/../../`);
const DIST_DIR = path.resolve(`${BASE_DIR}/dist`);

// Removes useless properties from the package.json
pkg.scripts = undefined;
pkg.devDependencies = undefined;

// Run the build script
execSync('npm run build');

// Copy the cleaned version of the 'package.json' file
fs.writeFileSync(`${DIST_DIR}/package.json`, JSON.stringify(pkg, null, 2));

// Copies the README.md file
fs.copyFileSync(`${BASE_DIR}/README.md`, `${DIST_DIR}/README.md`);

// Publishes the 'dist' directory
execSync('npm publish dist');
