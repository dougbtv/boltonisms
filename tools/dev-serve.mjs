#!/usr/bin/env node
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { extname, join } from 'path';

const PORT = process.env.PORT || 3000;
const DIST_DIR = './dist';
const PUBLIC_DIR = './public';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function serveFile(filePath, res) {
  try {
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const content = readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
    return true;
  } catch (err) {
    return false;
  }
}

const server = createServer((req, res) => {
  let url = req.url === '/' ? '/index.html' : req.url;

  url = url.split('?')[0];

  console.log(`${req.method} ${url}`);

  let filePath = join(DIST_DIR, url);
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    if (serveFile(filePath, res)) return;
  }

  filePath = join(PUBLIC_DIR, url);
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    if (serveFile(filePath, res)) return;
  }

  if (url.startsWith('/t/') || url === '/browse') {
    const indexPath = join(PUBLIC_DIR, 'index.html');
    if (existsSync(indexPath)) {
      if (serveFile(indexPath, res)) return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

server.listen(PORT, () => {
  console.log(`🚀 Dev server running at http://localhost:${PORT}`);
  console.log(`   Serving: ${PUBLIC_DIR} and ${DIST_DIR}`);
  console.log(`   Press Ctrl+C to stop`);
});
