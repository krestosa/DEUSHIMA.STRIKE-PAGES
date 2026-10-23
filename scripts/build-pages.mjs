/** Site build for repository-scoped GitHub Pages; local server and Vercel remain unchanged. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const siteBase = process.env.GITHUB_PAGES_BASE_PATH || '/DEUSHIMA.STRIKE/';
if (!/^\/(?:[a-zA-Z0-9._~-]+\/)+$/.test(siteBase)) throw new Error('Invalid repository Pages base path');
if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error('Run node scripts/build-static.mjs first');

// Assets extracted from GoldSrc are for local personal use only.
fs.rmSync(path.join(dist, 'assets', 'cs16'), { recursive: true, force: true });
fs.rmSync(path.join(dist, 'vercel.json'), { force: true });
fs.rmSync(path.join(dist, 'BUILD_INFO.txt'), { force: true });

// Rewrite only domain-root URLs beginning at a quoted string, NOT ../vendor relative ESM imports.
const rootUrl = /(["'`])\/(?=assets\/|src\/|vendor\/|favicon\.svg["'`])/g;
function rewrite(file) {
  const source = fs.readFileSync(file, 'utf8');
  const updated = source.replace(rootUrl, (_full, quote) => quote + siteBase);
  if (source !== updated) fs.writeFileSync(file, updated, 'utf8');
}
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(?:js|css|html)$/i.test(entry.name)) rewrite(file);
  }
}
rewrite(path.join(dist, 'index.html'));
walk(path.join(dist, 'src'));
fs.writeFileSync(path.join(dist, '.nojekyll'), '');
console.log('GitHub Pages build prepared at ' + siteBase + ' without GoldSrc assets');
