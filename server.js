// Dev server that serves static files and routes /api/* to the functions in ./api
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;
const ROOT = __dirname;

// Provide a default secret for local development (do NOT use in production)
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'dev-secret-capitao-animal';
}

const MIME = new Map(Object.entries({
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
}));

function send(res, code, headers = {}, body = Buffer.alloc(0)) {
  res.statusCode = code;
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(body);
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let rel = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
  if (!rel || rel === '/') {
    // Preferir index.html como página inicial; se não existir, cair para modern-index.html
    rel = fs.existsSync(path.join(ROOT, 'index.html')) ? 'index.html'
      : (fs.existsSync(path.join(ROOT, 'modern-index.html')) ? 'modern-index.html' : '');
  }
  if (rel.includes('..')) return send(res, 400, { 'Content-Type': 'text/plain; charset=utf-8' }, Buffer.from('Bad Request'));
  const filePath = path.join(ROOT, rel);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, Buffer.from('Not Found'));
  }
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME.get(ext) || 'application/octet-stream';
  const buf = fs.readFileSync(filePath);
  send(res, 200, { 'Content-Type': type, 'Content-Length': String(buf.length) }, buf);
}

function serveApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const name = url.pathname.replace(/^\/api\//, '').replace(/\/+$/, '');
  if (!name) return send(res, 404, { 'Content-Type': 'application/json' }, Buffer.from(JSON.stringify({ error: 'Not found' })));
  const file = path.join(ROOT, 'api', `${name}.js`);
  if (!fs.existsSync(file)) {
    return send(res, 404, { 'Content-Type': 'application/json' }, Buffer.from(JSON.stringify({ error: 'Not found' })));
  }
  try {
    delete require.cache[require.resolve(file)];
    const handler = require(file);
    if (typeof handler !== 'function') throw new Error('Invalid API handler');
    // Delegate handling to the API function (it will read body and set headers itself)
    return handler(req, res);
  } catch (e) {
    console.error('API error:', e);
    return send(res, 500, { 'Content-Type': 'application/json' }, Buffer.from(JSON.stringify({ error: 'Internal error' })));
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api/')) {
    return serveApi(req, res);
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    // Simple static server only supports GET/HEAD
    return send(res, 405, { 'Content-Type': 'text/plain; charset=utf-8' }, Buffer.from('Method Not Allowed'));
  }
  return serveStatic(req, res);
});

server.listen(PORT, () => {
  const host = `http://localhost:${PORT}/`;
  console.log(`Dev server running at ${host}`);
});