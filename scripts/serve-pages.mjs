/**
 * Local preview of the exact GitHub Pages dist build, served from its repository
 * subpath. Bind to loopback only; localhost is a secure context for WebRTC.
 * Usage: node scripts/serve-pages.mjs
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const prefix = process.env.GITHUB_PAGES_BASE_PATH || '/DEUSHIMA.STRIKE-PAGES/';
const host = '127.0.0.1';
const port = Number(process.env.GITHUB_PAGES_PREVIEW_PORT || 4173);
if (!/^\/(?:[A-Za-z0-9._~-]+\/)+$/.test(prefix)) throw new Error('Invalid base path');
if (!fs.existsSync(path.join(root, 'index.html'))) {
  throw new Error('Build dist first using node scripts/build-static.mjs && node scripts/build-pages.mjs');
}
const types = new Map(Object.entries({
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.fbx': 'application/octet-stream',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ico': 'image/x-icon',
}));
const server = http.createServer((req, res) => {
  const send = (code, message) => {
    res.writeHead(code, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    if (req.method === 'HEAD') res.end();
    else res.end(message);
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(405, 'Method not allowed');
  let pathname;
  try { pathname = new URL(req.url, 'http://localhost').pathname; }
  catch { return send(400, 'Invalid URL'); }
  if (pathname === '/') {
    res.writeHead(302, { Location: prefix, 'Cache-Control': 'no-store' });
    return res.end();
  }
  if (!pathname.startsWith(prefix)) return send(404, 'Not found');
  let rel;
  try { rel = decodeURIComponent(pathname.slice(prefix.length)); }
  catch { return send(400, 'Invalid encoding'); }
  if (!rel || rel.endsWith('/')) rel += 'index.html';
  if (rel.includes('\\') || rel.split('/').includes('..') || rel.includes('\0')) {
    return send(400, 'Invalid path');
  }
  const filename = path.resolve(root, rel);
  if (!filename.startsWith(root + path.sep)) return send(403, 'Forbidden');
  fs.stat(filename, (err, stat) => {
    if (err || !stat.isFile()) return send(404, 'Not found');
    res.writeHead(200, {
      'Content-Type': types.get(path.extname(filename).toLowerCase()) || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    if (req.method === 'HEAD') return res.end();
    const input = fs.createReadStream(filename);
    input.on('error', () => res.destroy());
    input.pipe(res);
  });
});
server.listen(port, host, () => {
  console.log(`DEUSHIMA Pages preview: http://localhost:${port}${prefix}`);
  console.log('PeerJS multiplayer is available over localhost (secure context).');
});
