import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.mjs': 'application/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.pdf': 'application/pdf', '.woff': 'font/woff', '.woff2': 'font/woff2',
};

/* Resolve a URL path the way GitHub Pages does:
   exact file → folder/index.html → path + ".html" */
function resolveFile(urlPath) {
  const base = path.join(__dirname, urlPath);
  /* Block requests that escape the project folder (e.g. /../../etc) */
  if (base !== __dirname && !base.startsWith(__dirname + path.sep)) return null;

  const candidates = [base, path.join(base, 'index.html'), base + '.html'];
  for (const file of candidates) {
    try {
      if (fs.statSync(file).isFile()) return file;
    } catch { /* try next */ }
  }
  return null;
}

http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  } catch {
    res.writeHead(400); res.end('Bad request'); return;
  }

  const file = resolveFile(urlPath);
  if (!file) {
    const notFound = path.join(__dirname, '404.html');
    fs.readFile(notFound, (err, data) => {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(err ? 'Not found' : data);
    });
    return;
  }

  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const size = fs.statSync(file).size;

  /* Safari only plays video when the server answers byte-range requests */
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (range && (range[1] || range[2])) {
    let start = range[1] ? parseInt(range[1], 10) : size - parseInt(range[2], 10);
    let end   = range[1] && range[2] ? parseInt(range[2], 10) : size - 1;
    start = Math.max(0, start);
    end   = Math.min(end, size - 1);
    if (start > end) {
      res.writeHead(416, { 'Content-Range': `bytes */${size}` }); res.end(); return;
    }
    res.writeHead(206, {
      'Content-Type': type, 'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1,
    });
    fs.createReadStream(file, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': size });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Fortune Haus running at http://localhost:${PORT}`));
