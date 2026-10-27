// Copies Preact, Preact's hooks and HTM from node_modules into react/, so
// react/react.js serves a pinned, offline copy instead of loading them from
// a CDN. The copies are generated (npm run vendor, and before packing) and
// not committed: package.json pins their versions.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const version = name => JSON.parse(readFileSync(join(root, 'node_modules', name, 'package.json'), 'utf8')).version;
const files = [
  { from: 'preact/dist/preact.mjs', to: 'react/preact.js', package: 'preact', license: 'MIT' },
  // Its bare "preact" import points at the copy beside it.
  { from: 'preact/hooks/dist/hooks.mjs', to: 'react/preact-hooks.js', package: 'preact', license: 'MIT', rewrite: s => s.replace(/from\s*["']preact["']/g, 'from"./preact.js"') },
  { from: 'htm/dist/htm.module.js', to: 'react/htm.js', package: 'htm', license: 'Apache-2.0' },
];

for (const f of files) {
  let source = readFileSync(join(root, 'node_modules', f.from), 'utf8').replace(/\n?\/\/# sourceMappingURL=\S+\s*$/, '\n');
  if (f.rewrite) source = f.rewrite(source);
  if (/from\s*["'][^."']/.test(source)) throw new Error(`${f.to} still has a bare import`);
  const banner = `/* ${f.package}@${version(f.package)} (${f.license}), generated from node_modules/${f.from} by tools/vendor-react.js. */\n`;
  writeFileSync(join(root, f.to), banner + source);
  console.log(`${f.to} <- ${f.package}@${version(f.package)}`);
}
