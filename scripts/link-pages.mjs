// Link the browser's exact entry-point ESM graph without opening a browser.
// Requires node --experimental-vm-modules. This catches missing named exports.
import fs from 'node:fs';
import path from 'node:path';
import * as vm from 'node:vm';
import { fileURLToPath } from 'node:url';

if (!vm.SourceTextModule) throw new Error('Run with --experimental-vm-modules');
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const base = process.env.GITHUB_PAGES_BASE_PATH || '/DEUSHIMA.STRIKE/';
const cache = new Map();
function getModule(filename) {
  const id = path.resolve(filename);
  if (!id.startsWith(dist + path.sep) || !fs.existsSync(id)) {
    throw new Error('Missing or external JavaScript module: ' + filename);
  }
  if (cache.has(id)) return cache.get(id);
  const mod = new vm.SourceTextModule(fs.readFileSync(id, 'utf8'), { identifier: id });
  cache.set(id, mod);
  return mod;
}
const main = getModule(path.join(dist, 'src', 'main.js'));
await main.link(async (specifier, referencingModule) => {
  if (specifier === 'three') return getModule(path.join(dist, 'vendor', 'three.module.js'));
  if (specifier.startsWith('.')) return getModule(path.resolve(path.dirname(referencingModule.identifier), specifier));
  if (specifier.startsWith(base)) return getModule(path.resolve(dist, specifier.slice(base.length)));
  throw new Error('Unsupported import ' + specifier + ' from ' + referencingModule.identifier);
});
console.log('Entry module graph linked: ' + cache.size + ' ESM files, no unresolved exports');
