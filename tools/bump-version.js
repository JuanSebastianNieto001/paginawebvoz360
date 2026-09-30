/* ==========================================================================
   Nueva versión de CSS y JS (evita que los navegadores usen archivos viejos)
   Reemplaza el parámetro ?v=… de todos los enlaces a assets/css y assets/js
   en los HTML de public/ por un valor nuevo. Ejecutar antes de cada commit
   que cambie estilos o scripts.
   Uso:  node tools/bump-version.js
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'public');
const version = Date.now().toString(36);
const pattern = /(assets\/(?:css|js)\/[\w/.-]+\.(?:css|js))\?v=[\w]+/g;

fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).forEach(f => {
  const file = path.join(ROOT, f);
  const html = fs.readFileSync(file, 'utf8');
  let count = 0;
  const updated = html.replace(pattern, (m, url) => { count++; return url + '?v=' + version; });
  if (count) fs.writeFileSync(file, updated);
  console.log(f + ': ' + count + ' enlaces → v=' + version);
});
