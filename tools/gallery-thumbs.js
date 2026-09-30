/* ==========================================================================
   Miniaturas desenfocadas para el fondo de la galería
   Por cada foto de public/assets/img/galeria/ crea una versión de 96 px ya
   desenfocada en galeria/blur/ (pesan ~1-2 KB). El carrusel las usa de fondo
   en lugar de desenfocar la foto grande en vivo, que es muy costoso.
   Ejecutar después de agregar o cambiar fotos de la galería.
   Uso:  cd tools && npm install && node gallery-thumbs.js
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DIR = path.join(__dirname, '..', 'public', 'assets', 'img', 'galeria');
const OUT = path.join(DIR, 'blur');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const photos = fs.readdirSync(DIR).filter(f => /\.jpe?g$/i.test(f));
  for (const f of photos) {
    await sharp(path.join(DIR, f)).resize(96).blur(2.5).modulate({ saturation: 1.1 }).jpeg({ quality: 70 }).toFile(path.join(OUT, f));
    console.log('blur/' + f);
  }
  // Borra miniaturas de fotos que ya no existen
  fs.readdirSync(OUT).filter(f => !photos.includes(f)).forEach(f => { fs.unlinkSync(path.join(OUT, f)); console.log('eliminada blur/' + f); });
})().catch(e => { console.error(e); process.exit(1); });
