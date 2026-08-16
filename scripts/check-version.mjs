/**
 * One version, in two manifests that cannot be generated from each other.
 *
 * `package.json` is what the toolchain reads; `public/manifest.json` is what the browser
 * installs and what ends up in the zip's name. A mismatch produces an artefact whose
 * version disagrees with the extension inside it — cheap to check, and invisible until
 * somebody reports a version that does not exist.
 *
 * With an argument, also assert the version matches that git tag (`v0.3.0`).
 *
 * The desktop app has the same script in bash. This one is Node because that is what this
 * repo already has, and adding a shell dependency to check two JSON files would be a
 * strange way to save a file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(message) {
  console.error(`version check: ${message}`);
  process.exit(1);
}

const read = (file) => {
  const full = path.join(root, file);
  try {
    return JSON.parse(fs.readFileSync(full, 'utf8')).version;
  } catch {
    return fail(`could not read a version from ${file}`);
  }
};

const pkg = read('package.json');
const manifest = read('public/manifest.json');

if (pkg !== manifest) {
  fail(`manifests disagree — package.json ${pkg}, public/manifest.json ${manifest}`);
}

const [, , ref] = process.argv;
if (ref) {
  const tag = ref.replace(/^refs\/tags\//, '');
  if (tag !== `v${pkg}`) {
    fail(`tag ${tag} does not match the manifests (${pkg}) — expected v${pkg}`);
  }
  console.log(`version check: ${tag} matches both manifests`);
} else {
  console.log(`version check: both manifests say ${pkg}`);
}
