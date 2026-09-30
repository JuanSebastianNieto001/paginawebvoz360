/* ==========================================================================
   Servidor local para probar el sitio igual que en Vercel
   Sirve la carpeta public/ con las mismas cabeceras de seguridad de
   vercel.json (CSP, X-Frame-Options, etc.), así cualquier recurso que la
   política bloquee se detecta antes de publicar.
   Uso:  node tools/serve.js [puerto]      (por defecto 8080)
   ========================================================================== */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'public');
const PORT = Number(process.argv[2]) || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8'
};

// Cabeceras de vercel.json. HSTS y upgrade-insecure-requests se omiten: en local no hay HTTPS.
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
const securityHeaders = {};
(config.headers.find(h => h.source === '/(.*)') || { headers: [] }).headers.forEach(h => {
  if (h.key === 'Strict-Transport-Security') return;
  securityHeaders[h.key] = h.value.replace(/;\s*upgrade-insecure-requests/, '');
});

http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url.endsWith('/')) url += 'index.html';
  const file = path.normalize(path.join(ROOT, url));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }   // evita salir de public/
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, securityHeaders); return res.end('404'); }
    res.writeHead(200, Object.assign({ 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }, securityHeaders));
    res.end(data);
  });
}).listen(PORT, () => console.log('VOZ360 en http://localhost:' + PORT));
