import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const coreAreas = new Set([
  'animation',
  'async',
  'browser',
  'collections',
  'crypto',
  'datetime',
  'devices',
  'dom',
  'encoding',
  'files',
  'graphics',
  'localization',
  'media',
  'navigation',
  'net',
  'storage',
  'streams',
]);
const ignoredDirectories = new Set([
  '.git',
  'node_modules',
  'playwright-report',
  'test-results',
]);
const optionalAreas = new Set(['adapters', 'elements', 'integrations']);
const failures = [];

function walk(directory, predicate = () => true) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(path, predicate));
    else if (predicate(path)) files.push(path);
  }
  return files;
}

const pathFromRoot = path => relative(root, path).split(sep).join('/');
const topArea = path => pathFromRoot(path).split('/')[0];

function fail(path, message) {
  failures.push(`${pathFromRoot(path)}: ${message}`);
}

const rootScripts = readdirSync(root, { withFileTypes: true })
  .filter(entry => entry.isFile() && extname(entry.name) === '.js');
for (const entry of rootScripts) {
  fail(join(root, entry.name), 'JavaScript entry points belong in a capability or optional-layer directory');
}

const javascriptFiles = walk(root, path => extname(path) === '.js');
const importPattern = /\b(?:import\s*(?:[^'";]*?\sfrom\s*)?|export\s+(?:\*|\{[^}]*\})\s+from\s*|import\s*\(\s*)['"]([^'"]+)['"]/g;

function validateImport(file, specifier, { enforceLayers = true } = {}) {
  if (!specifier.startsWith('.')) {
    if (enforceLayers && (coreAreas.has(topArea(file)) || ['elements', 'integrations'].includes(topArea(file)))) {
      fail(file, `bare or absolute dependencies are not allowed in this layer: ${specifier}`);
    }
    return;
  }
  if (!extname(specifier.split(/[?#]/, 1)[0])) {
    fail(file, `relative import must include a file extension: ${specifier}`);
    return;
  }
  const target = resolve(dirname(file), specifier.split(/[?#]/, 1)[0]);
  if (!existsSync(target) || !statSync(target).isFile()) {
    fail(file, `unresolved relative import: ${specifier}`);
    return;
  }
  if (!enforceLayers) return;

  const sourceArea = topArea(file);
  const targetArea = topArea(target);
  if (coreAreas.has(sourceArea) && !coreAreas.has(targetArea)) {
    fail(file, `core cannot depend on ${targetArea}/: ${specifier}`);
  }
  if (optionalAreas.has(sourceArea)
    && !coreAreas.has(targetArea)
    && targetArea !== sourceArea) {
    fail(file, `${sourceArea}/ cannot depend on ${targetArea}/: ${specifier}`);
  }
}

for (const file of javascriptFiles) {
  const syntax = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (syntax.status !== 0) fail(file, syntax.stderr.trim() || 'syntax check failed');

  const source = readFileSync(file, 'utf8');
  if (!source.trim()) fail(file, 'empty JavaScript files are not allowed');
  for (const match of source.matchAll(importPattern)) {
    validateImport(file, match[1]);
  }
}

const htmlFiles = walk(root, path => extname(path) === '.html');
const assetPattern = /\b(?:src|href)\s*=\s*["']([^"']+)["']/gi;
for (const file of htmlFiles) {
  const source = readFileSync(file, 'utf8');
  if (!source.trim()) fail(file, 'empty HTML files are not allowed');
  for (const match of source.matchAll(importPattern)) {
    validateImport(file, match[1], { enforceLayers: false });
  }
  for (const match of source.matchAll(assetPattern)) {
    const reference = match[1];
    if (/^(?:[a-z]+:|\/\/|#)/i.test(reference)) continue;
    const cleanReference = reference.split(/[?#]/, 1)[0];
    if (!cleanReference) continue;
    const target = reference.startsWith('/')
      ? resolve(root, `.${cleanReference}`)
      : resolve(dirname(file), cleanReference);
    if (!existsSync(target)) fail(file, `unresolved local asset: ${reference}`);
  }
}

const cssFiles = walk(root, path => extname(path) === '.css');
for (const file of cssFiles) {
  const source = readFileSync(file, 'utf8');
  if (!source.trim()) fail(file, 'empty CSS files are not allowed');
  if (/(?:@import\s+|url\(\s*)['"]?https?:\/\//i.test(source)) {
    fail(file, 'remote CSS dependencies must be owned and resolved by the consuming HTML explicitly');
  }
}

if (failures.length) {
  console.error(`Repository validation failed (${failures.length}):\n${failures.map(item => `- ${item}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Repository validation passed: ${javascriptFiles.length} JavaScript, ${htmlFiles.length} HTML, and ${cssFiles.length} CSS files.`);
}
