/** Validate every bundled ESM import and referenced public asset before publishing. */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const siteBase = process.env.GITHUB_PAGES_BASE_PATH || '/DEUSHIMA.STRIKE-PAGES/';
const errors = [];
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full); else files.push(full);
  }
}
walk(root);
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!html.includes('__DEUSHIMA_PUBLIC__ = true')) errors.push('Public flag is missing');
if (!fs.existsSync(path.join(root, '.nojekyll'))) errors.push('Missing .nojekyll');
if (fs.existsSync(path.join(root, 'assets', 'cs16'))) errors.push('GoldSrc assets must not be published');
if (fs.existsSync(path.join(root, 'vercel.json'))) errors.push('Vercel configuration must not be in Pages');
const important = ['src/main.js', 'vendor/three.module.js', 'vendor/libs/fflate.module.js',
  'assets/branding/deushima-strike.png', 'assets/characters/characterMedium.fbx',
  'assets/characters/idle.fbx', 'assets/characters/run.fbx', 'assets/characters/jump.fbx'];
for (const rel of important) if (!fs.existsSync(path.join(root, rel))) errors.push('Missing asset: ' + rel);

function checkUrl(url, from) {
  if (/^(?:https?:|data:|#)/.test(url)) return;
  if (!url.startsWith(siteBase)) {
    errors.push('Unprefixed root URL: ' + url + ' in ' + from); return;
  }
  const pathPart = decodeURIComponent(url.slice(siteBase.length).split(/[?#]/)[0]);
  const candidate = path.resolve(root, pathPart);
  if (!candidate.startsWith(root + path.sep) || !fs.existsSync(candidate)) {
    errors.push('Missing URL target: ' + url + ' in ' + from);
  }
}

for (const match of html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g)) checkUrl(match[1], 'index.html');
let imports = 0;
let scripts = 0;
for (const file of files.filter((p) => /\.js$/i.test(p))) {
  scripts++;
  const rel = path.relative(root, file).replaceAll('\\', '/');
  const syntax = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (syntax.status !== 0) errors.push('Invalid JavaScript ' + rel + ': ' + (syntax.stderr || '').slice(0, 240));
  const source = fs.readFileSync(file, 'utf8');
  if (/\.\.\/DEUSHIMA\.STRIKE\/|\/DEUSHIMA\.STRIKE\/DEUSHIMA\.STRIKE\//.test(source)) errors.push('Corrupt ESM import: ' + rel);
  // Static import/export declarations, including multiline named imports.
  const declarations = /\b(?:import|export)\s+(?:[\w\s{},*]+?\s+from\s*)?["']([^"']+)["']/g;
  for (const match of source.matchAll(declarations)) {
    const specifier = match[1];
    imports++;
    let target;
    if (specifier === 'three') target = path.join(root, 'vendor', 'three.module.js');
    else if (specifier.startsWith('.')) target = path.resolve(path.dirname(file), specifier);
    else if (specifier.startsWith('/')) {
      checkUrl(specifier, rel); continue;
    } else { errors.push('Unresolved package ' + specifier + ' from ' + rel); continue; }
    if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) {
      errors.push('Missing module: ' + rel + ' -> ' + specifier);
    }
  }
  if (/\.(?:css|html)$/i.test(file)) continue;
}
for (const file of files.filter((p) => /\.(?:css|html)$/i.test(p))) {
  const rel = path.relative(root, file);
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/url\(\s*["']?(\/[^"')]+)["']?\s*\)/g)) checkUrl(match[1], rel);
}
if (imports < 40) errors.push('Suspiciously few ESM dependencies inspected: ' + imports);
if (errors.length) {
  console.error('GitHub Pages audit failed (' + errors.length + '):\n' + errors.map((s) => ' - ' + s).join('\n'));
  process.exitCode = 1;
} else {
  console.log('GitHub Pages audit OK: ' + scripts + ' JS files, ' + imports + ' ESM references, assets and public URLs');
}
