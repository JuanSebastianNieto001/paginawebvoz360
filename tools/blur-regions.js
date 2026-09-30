/* ==========================================================================
   Desenfocar zonas de una foto (pantallas, documentos, marcas de clientes)
   Control ISO/IEC 27001 A.7.7 (pantalla y escritorio limpios): ninguna foto
   publicada debe mostrar información de clientes ni sistemas internos.
   Las zonas se indican en PORCENTAJE de la foto: x0,y0,x1,y1 (esquina
   superior izquierda y esquina inferior derecha), separadas por ";".
   El borde del desenfoque es suave y los rostros no se tocan si las zonas
   se marcan con cuidado. La foto resultante no conserva metadatos (GPS, etc.).
   Uso:
     node blur-regions.js entrada.jpg salida.jpg "10,43,39.5,50;23,49.5,40,61.5"
   Consejo: revisar SIEMPRE la foto a resolución completa antes de publicarla.
   ========================================================================== */
'use strict';

const sharp = require('sharp');

const [input, output, spec] = process.argv.slice(2);
if (!input || !output || !spec) {
  console.log('Uso: node blur-regions.js entrada.jpg salida.jpg "x0,y0,x1,y1;x0,y0,x1,y1"');
  process.exit(1);
}
const regions = spec.split(';').map(r => r.split(',').map(Number));

(async () => {
  const { width: W, height: H } = await sharp(input).rotate().metadata();
  const sigma = Math.round(W * 0.018);   // intensidad del desenfoque (proporcional a la foto)
  const feather = Math.round(W * 0.006); // suavidad del borde
  // Máscara: blanco = zona a desenfocar
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#000"/>` +
    regions.map(([x0, y0, x1, y1]) => `<rect x="${x0 * W / 100}" y="${y0 * H / 100}" width="${(x1 - x0) * W / 100}" height="${(y1 - y0) * H / 100}" rx="${feather}" fill="#fff"/>`).join('') + '</svg>';
  const mask = await sharp(Buffer.from(svg)).flatten({ background: '#000' }).blur(feather).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
  // Se desenfoca la foto completa y se aplica solo donde la máscara es blanca
  const blurred = await sharp(await sharp(input).rotate().blur(sigma).removeAlpha().png().toBuffer())
    .joinChannel(mask.data, { raw: mask.info }).png().toBuffer();
  await sharp(input).rotate().composite([{ input: blurred }]).jpeg({ quality: 84, mozjpeg: true }).toFile(output);
  console.log('ok → ' + output + ' (' + regions.length + ' zonas)');
})().catch(e => { console.error(e); process.exit(1); });
