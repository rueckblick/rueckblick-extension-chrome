/**
 * Produce loadable artefacts from a built `dist/`.
 *
 * Until now the only way to install this was "load unpacked from dist/", which is fine for
 * the person who built it and no use to anyone else. This writes a zip per engine, which is
 * what both stores take and what a human can hand to another human.
 *
 * **Chrome and Firefox differ in exactly two places**, and both are in the manifest:
 *
 * - **The background.** Chrome MV3 runs a service worker; Firefox MV3 runs an event page
 *   declared as `scripts`. The same `background.js` is loaded either way — nothing in it
 *   assumes a `ServiceWorkerGlobalScope`.
 * - **An extension id.** Firefox requires one under `browser_specific_settings` before it
 *   will install or sign anything; Chrome assigns one itself.
 *
 * Everything else — permissions, the content script, the block page, `declarativeNetRequest`
 * — is written to the shared MV3 shape. The one place that was Chrome-only was the DNR rule
 * builder reaching for `chrome.declarativeNetRequest.RuleActionType`, a runtime enum that
 * does not exist off Chrome; it now uses the contract's own strings.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const out = path.join(root, 'artifacts');

/** Firefox's own id for this add-on. Stable: changing it makes it a different add-on. */
const GECKO_ID = 'rueckblick@rueckblick.app';

if (!fs.existsSync(path.join(dist, 'manifest.json'))) {
  console.error('no built dist/ — run `pnpm build` first');
  process.exit(1);
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const chromeManifest = JSON.parse(fs.readFileSync(path.join(dist, 'manifest.json'), 'utf8'));

/** The same build, with the two manifest keys Firefox needs instead of Chrome's. */
function firefoxManifest(manifest) {
  const copy = structuredClone(manifest);
  delete copy.background.service_worker;
  copy.background = { scripts: ['background.js'], type: 'module' };
  copy.browser_specific_settings = {
    gecko: {
      id: GECKO_ID,
      // 142, not something older: that is the first release — desktop *and*
      // Android — that understands the data-collection declaration below, and a
      // floor promising less than the manifest states would be the wrong way
      // round. Android is not a target anyway (there is no desktop app on the
      // other end of the loopback socket), but the floor costs nothing.
      strict_min_version: '142.0',
      // Firefox requires this to be stated, and for this extension the honest
      // answer is the strongest one. Nothing is collected: the focused tab's URL
      // goes to a WebSocket on 127.0.0.1 owned by the user's own desktop app and
      // no further, and no URL is ever written to storage. There is no endpoint
      // belonging to anyone else for it to reach.
      data_collection_permissions: { required: ['none'] },
    },
  };
  return copy;
}

/** A directory built from `dist/`, with `manifest.json` replaced. */
function stage(name, manifest) {
  const dir = path.join(out, name);
  fs.cpSync(dist, dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return dir;
}

function zip(dir, name) {
  const archive = path.join(out, name);
  // `zip` rather than a library: one fewer dependency, and the store only cares
  // about the bytes. `-r` recursive, `-q` quiet, run from inside so paths are
  // relative to the extension root — a zip with a leading directory is refused.
  execFileSync('zip', ['-qr', archive, '.'], { cwd: dir });
  return archive;
}

const chromeDir = stage('chrome', chromeManifest);
const firefoxDir = stage('firefox', firefoxManifest(chromeManifest));

const version = chromeManifest.version;
const artefacts = [
  zip(chromeDir, `rueckblick-chrome-${version}.zip`),
  zip(firefoxDir, `rueckblick-firefox-${version}.zip`),
];

for (const artefact of artefacts) {
  const { size } = fs.statSync(artefact);
  console.log(`${(size / 1024).toFixed(1)} KiB  ${path.relative(root, artefact)}`);
}
