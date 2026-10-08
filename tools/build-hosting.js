/* ==========================================================================
   PAQUETE PARA HOSTING CON APACHE (GoDaddy cPanel u otro)
   Uso:  node tools/build-hosting.js [dominio]      (por defecto voz360.co)

   1. Copia public/ en dist/hosting/.
   2. Escribe dist/hosting/.htaccess con las MISMAS cabeceras de seguridad de
      vercel.json (Apache no lee vercel.json), HTTPS obligatorio, redirección
      de www al dominio principal y caché de un año para assets/.
   3. Ajusta security.txt al dominio definitivo.
   4. Comprime todo en dist/voz360-hosting.zip, listo para subir y
      descomprimir en public_html/.
   dist/ no se versiona (.gitignore). Ver docs/DESPLIEGUE.md.
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DOMAIN = (process.argv[2] || 'voz360.co').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'public');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(DIST, 'hosting');
const ZIP = path.join(DIST, 'voz360-hosting.zip');

/* ---------- 1. Copia de public/ ---------- */
fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(SRC, OUT, { recursive: true });

/* ---------- 2. .htaccess a partir de vercel.json ---------- */
const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const globalHeaders = vercel.headers.find(h => h.source === '/(.*)').headers;
const assetHeaders = vercel.headers.find(h => h.source === '/assets/(.*)').headers;
const esc = v => v.replace(/"/g, '\\"');

const lines = [
  '# ============================================================================',
  '# VOZ360 — configuración de Apache (generado por tools/build-hosting.js)',
  '# No editar a mano: cambiar vercel.json y volver a generar el paquete.',
  '# ============================================================================',
  '',
  '# Sin listado de carpetas; página de inicio',
  'Options -Indexes',
  'DirectoryIndex index.html',
  '',
  '# HTTPS obligatorio y dominio sin "www"',
  '<IfModule mod_rewrite.c>',
  '  RewriteEngine On',
  '  RewriteCond %{HTTPS} off [OR]',
  `  RewriteCond %{HTTP_HOST} ^www\\.${DOMAIN.replace(/\./g, '\\.')}$ [NC]`,
  `  RewriteRule ^ https://${DOMAIN}%{REQUEST_URI} [L,R=301]`,
  '',
  '  # Archivos ocultos (.htaccess, .git…) no accesibles, salvo /.well-known/',
  '  RewriteRule (^|/)\\.(?!well-known/) - [F]',
  '</IfModule>',
  '',
  '# Cabeceras de seguridad (las mismas de vercel.json; ISO/IEC 27001 A.8.9, A.8.26)',
  '<IfModule mod_headers.c>'
];
for (const h of globalHeaders) {
  // HSTS solo por HTTPS y sin includeSubDomains/preload: el dominio corporativo
  // tiene otros servicios (correo de Google) y la lista de precarga es difícil de revertir
  if (h.key === 'Strict-Transport-Security') {
    lines.push('  Header always set Strict-Transport-Security "max-age=31536000" "expr=%{HTTPS} == \'on\'"');
    continue;
  }
  lines.push(`  Header always set ${h.key} "${esc(h.value)}"`);
}
lines.push('  Header always unset X-Powered-By', '  Header unset Server');
lines.push('', '  # Imágenes, fuentes, CSS y JS: un año en el navegador (los CSS/JS llevan ?v=)');
lines.push('  <If "%{REQUEST_URI} =~ m#^/assets/#">');
for (const h of assetHeaders) lines.push(`    Header set ${h.key} "${esc(h.value)}"`);
lines.push('  </If>', '  # Las páginas se revalidan siempre (así se ve cada cambio publicado)');
lines.push('  <FilesMatch "\\.(html|txt|xml)$">', '    Header set Cache-Control "no-cache, no-store, must-revalidate"', '  </FilesMatch>', '</IfModule>', '');
lines.push(
  '# Tipos de archivo',
  '<IfModule mod_mime.c>',
  '  AddType image/svg+xml .svg',
  '  AddType font/woff2 .woff2',
  '  AddType video/mp4 .mp4',
  '  AddType text/plain .txt',
  '  AddDefaultCharset utf-8',
  '  AddCharset utf-8 .html .css .js .txt .svg',
  '</IfModule>',
  '',
  '# Compresión',
  '<IfModule mod_deflate.c>',
  '  AddOutputFilterByType DEFLATE text/html text/css application/javascript text/javascript image/svg+xml text/plain',
  '</IfModule>',
  '',
  '# Página de error',
  'ErrorDocument 404 /index.html',
  ''
);
fs.writeFileSync(path.join(OUT, '.htaccess'), lines.join('\n'));

/* ---------- 3. security.txt con el dominio definitivo ---------- */
const sec = path.join(OUT, '.well-known', 'security.txt');
fs.writeFileSync(sec, fs.readFileSync(sec, 'utf8').replace(/https:\/\/[^/\s]+/g, 'https://' + DOMAIN));

/* ---------- 4. ZIP ---------- */
// Rutas con "/" (el servidor es Linux): en Windows se usa tar.exe del sistema,
// no Compress-Archive, que guarda las rutas con "\"
const entries = fs.readdirSync(OUT);
if (process.platform === 'win32') {
  execFileSync(path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe'), ['-a', '-cf', ZIP, ...entries], { cwd: OUT, stdio: 'inherit' });
} else {
  execFileSync('zip', ['-qr', ZIP, ...entries], { cwd: OUT, stdio: 'inherit' });
}

const count = d => fs.readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? count(path.join(d, e.name)) : 1), 0);
console.log(`Paquete listo para ${DOMAIN}: ${count(OUT)} archivos`);
console.log(`  Carpeta: ${path.relative(ROOT, OUT)}`);
console.log(`  ZIP:     ${path.relative(ROOT, ZIP)} (${(fs.statSync(ZIP).size / 1048576).toFixed(1)} MB)`);
