import path from 'node:path';
import fs from 'fs-extra';

const rootDir = path.resolve(path.dirname('.'));
const srcDir = path.resolve(rootDir, 'src');
const manifestPath = path.resolve(srcDir, 'manifest.json');
const versionPath = path.resolve(srcDir, 'assets', 'js', 'versions.json');

/**
 * Reads a JSON file from file system and returns the JSON object.
 */
export function readJson(jsonPath: string) : any {	
	const json = fs.readFileSync(jsonPath, 'utf8');
	const content = JSON.parse(json);
	
	return content;
}

/**
 * Writes a JSON file to file system given the JSON object.
 */
export function writeJson(jsonPath: string, content: any) {
	const json = JSON.stringify(content, null, '\t');
	fs.writeFileSync(jsonPath, json, 'utf8');	
}

/**
 * Copies the version entry from Manifest to runtime versions.json file.
 * The *versions.json* file contains all versions of components not directly available.
 */
export function copyVersion() {
	const manifest = readJson(manifestPath);
	const version = manifest.version;
	const versions = readJson(versionPath);
	versions.version = version;
	versions.build ++;
	writeJson(versionPath, versions);
}
