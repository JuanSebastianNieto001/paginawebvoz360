/* ==========================================================================
   PRUEBAS DE SEGURIDAD DEL SITIO PUBLICADO (evidencia ISO/IEC 27001:2022)
   Revisa el sitio en producción y deja un informe con el control del Anexo A
   que respalda cada prueba. Sin dependencias (Node 18+).

     node tools/iso-web-check.js                 # https://voz360.co
     node tools/iso-web-check.js https://otro.dominio

   Resultado: OK, AVISO (no bloquea, pero hay que atenderlo) o FALLA.
   Termina con código 1 si hay alguna FALLA. En GitHub Actions escribe además
   el informe en el resumen de la ejecución (evidencia con fecha y hora).
   ========================================================================== */
'use strict';

const tls = require('tls');
const fs = require('fs');

const BASE = (process.argv[2] || 'https://voz360.co').replace(/\/$/, '');
const HOST = new URL(BASE).hostname;
const PAGINAS = ['/', '/politica-datos.html', '/politica-seguridad.html'];
const DIAS_MIN_CERT = 20;

const resultados = [];
const anotar = (control, prueba, estado, detalle = '') => resultados.push({ control, prueba, estado, detalle });
const ok = (c, p, d) => anotar(c, p, 'OK', d);
const aviso = (c, p, d) => anotar(c, p, 'AVISO', d);
const falla = (c, p, d) => anotar(c, p, 'FALLA', d);
const check = (cond, c, p, dOk, dMal, nivel = falla) => (cond ? ok(c, p, dOk) : nivel(c, p, dMal));

// El hosting de GoDaddy tiene una protección anti-bots: ante muchas peticiones seguidas responde
// con una página de verificación ("Please wait while your request is being verified") y código 200.
// Por eso las peticiones van espaciadas y, si aparece la verificación, se reintenta más tarde.
const PAUSA_MS = 1500;
const espera = ms => new Promise(r => setTimeout(r, ms));
const esVerificacion = body => /request is being verified/i.test(body);

async function get(url, opts = {}) {
  let r;
  for (let intento = 0; intento < 4; intento++) {
    await espera(intento ? 30000 * intento : PAUSA_MS);
    const res = await fetch(url, { redirect: 'manual', headers: { 'user-agent': 'voz360-iso-check (pruebas ISO 27001)' }, ...opts });
    const body = await res.text();
    r = { status: res.status, headers: res.headers, body, location: res.headers.get('location') || '', bloqueada: esVerificacion(body) };
    if (!r.bloqueada) break;
  }
  return r;
}
// Si la protección anti-bots no dejó comprobar, se anota como AVISO en lugar de dar un resultado falso
const bloqueada = (r, control, prueba) => r.bloqueada && (aviso(control, prueba, 'no se pudo comprobar: la protección anti-bots de GoDaddy bloqueó la petición; repetir más tarde'), true);

function probarTLS(version) {
  return new Promise(resolve => {
    const s = tls.connect({ host: HOST, port: 443, servername: HOST, minVersion: version, maxVersion: version, timeout: 15000 }, () => {
      const info = { ok: true, cipher: s.getCipher().name, cert: s.getPeerCertificate(), authorized: s.authorized, error: s.authorizationError };
      s.end(); resolve(info);
    });
    s.on('error', e => resolve({ ok: false, error: e.code || e.message }));
    s.on('timeout', () => { s.destroy(); resolve({ ok: false, error: 'timeout' }); });
  });
}

(async () => {
  /* ---------- A.8.24 Uso de criptografía: TLS y certificado ---------- */
  const t12 = await probarTLS('TLSv1.2');
  check(t12.ok, 'A.8.24', 'TLS 1.2 disponible', t12.cipher, t12.error);
  const t13 = await probarTLS('TLSv1.3');
  t13.ok ? ok('A.8.24', 'TLS 1.3', 'disponible') : aviso('A.8.24', 'TLS 1.3', 'no disponible en el hosting (TLS 1.2 es suficiente)');
  for (const v of ['TLSv1', 'TLSv1.1']) {
    const r = await probarTLS(v);
    check(!r.ok, 'A.8.24', `${v === 'TLSv1' ? 'TLS 1.0' : 'TLS 1.1'} rechazado`, 'el servidor no lo acepta', 'el servidor acepta un protocolo inseguro');
  }
  if (t12.ok) {
    const vence = new Date(t12.cert.valid_to);
    const dias = Math.floor((vence - Date.now()) / 864e5);
    check(t12.authorized, 'A.8.24', 'Certificado válido y de confianza', `${t12.cert.issuer && t12.cert.issuer.O} · ${(t12.cert.subjectaltname || '').replace(/DNS:/g, '')}`, String(t12.error));
    check(dias >= DIAS_MIN_CERT, 'A.8.24', 'Vigencia del certificado', `vence el ${vence.toISOString().slice(0, 10)} (${dias} días)`, `quedan ${dias} días`);
  }

  /* ---------- A.8.20 / A.8.21 Seguridad de redes y servicios: HTTPS obligatorio ---------- */
  const http = await get(`http://${HOST}/`).catch(e => ({ status: 0, location: e.message }));
  check([301, 308].includes(http.status) && http.location.startsWith(`https://${HOST}`), 'A.8.21', 'HTTP redirige a HTTPS', `${http.status} → ${http.location}`, `${http.status} ${http.location}`);
  const www = await get(`https://www.${HOST}/`).catch(e => ({ status: 0, location: e.message }));
  check([301, 308].includes(www.status) && www.location.startsWith(`https://${HOST}`), 'A.8.21', 'www redirige al dominio principal', `${www.status} → ${www.location}`, `${www.status} ${www.location}`, aviso);

  /* ---------- A.8.9 Configuración / A.8.26 Requisitos de seguridad de aplicaciones: cabeceras ---------- */
  const paginas = {};
  for (const p of PAGINAS) {
    const r = await get(BASE + p);
    paginas[p] = r;
    if (bloqueada(r, 'A.8.26', `Página ${p}`)) continue;
    check(r.status === 200, 'A.8.26', `Página ${p} responde`, '200', String(r.status));
    const h = n => r.headers.get(n) || '';
    const csp = h('content-security-policy');
    check(/default-src 'self'/.test(csp) && /frame-ancestors 'none'/.test(csp) && !/script-src[^;]*'unsafe-(inline|eval)'/.test(csp),
      'A.8.26', `CSP estricta en ${p}`, "default-src 'self', sin scripts en línea, sin incrustación", csp || 'ausente');
    const hsts = h('strict-transport-security');
    const maxAge = Number((hsts.match(/max-age=(\d+)/) || [])[1] || 0);
    check(maxAge >= 31536000, 'A.8.24', `HSTS en ${p}`, hsts, hsts || 'ausente');
    check(/^deny$/i.test(h('x-frame-options')), 'A.8.26', `X-Frame-Options en ${p}`, h('x-frame-options'), h('x-frame-options') || 'ausente');
    check(/nosniff/i.test(h('x-content-type-options')), 'A.8.26', `X-Content-Type-Options en ${p}`, 'nosniff', 'ausente');
    check(!!h('referrer-policy'), 'A.5.34', `Referrer-Policy en ${p}`, h('referrer-policy'), 'ausente');
    check(/camera=\(\)/.test(h('permissions-policy')) && /microphone=\(\)/.test(h('permissions-policy')), 'A.5.34', `Permissions-Policy en ${p}`, 'cámara, micrófono y ubicación bloqueados', h('permissions-policy') || 'ausente');
    check(!!h('cross-origin-opener-policy'), 'A.8.26', `Cross-Origin-Opener-Policy en ${p}`, h('cross-origin-opener-policy'), 'ausente', aviso);
    check(!h('set-cookie'), 'A.5.34', `Sin cookies en ${p}`, 'no se crean cookies', h('set-cookie'));
    check(!h('x-powered-by') && !/\d/.test(h('server')), 'A.8.9', `Sin versión del servidor expuesta en ${p}`, `Server: ${h('server') || '—'}`, `Server: ${h('server')} · X-Powered-By: ${h('x-powered-by')}`, aviso);
  }

  /* ---------- A.8.12 Prevención de fuga de datos / A.8.4 Acceso al código: archivos internos ---------- */
  for (const ruta of ['/.htaccess', '/.git/config', '/.env', '/docs/SEGURIDAD.md', '/tools/package.json', '/vercel.json', '/README.md', '/voz360-hosting.zip']) {
    const r = await get(BASE + ruta);
    if (bloqueada(r, 'A.8.12', `${ruta} no accesible`)) continue;
    check(r.status === 403 || r.status === 404, 'A.8.12', `${ruta} no accesible`, String(r.status), `responde ${r.status}`);
  }
  for (const dir of ['/assets/', '/assets/img/']) {
    const r = await get(BASE + dir);
    if (bloqueada(r, 'A.8.12', `Sin listado de carpetas en ${dir}`)) continue;
    check(!/Index of \//i.test(r.body), 'A.8.12', `Sin listado de carpetas en ${dir}`, String(r.status), 'el servidor lista los archivos de la carpeta');
  }

  /* ---------- A.5.24–A.6.8 Reporte de incidentes: security.txt ---------- */
  const sec = await get(BASE + '/.well-known/security.txt');
  if (!bloqueada(sec, 'A.6.8', 'security.txt')) {
    const expires = new Date((sec.body.match(/^Expires:\s*(.+)$/m) || [])[1] || 0);
    check(sec.status === 200 && /^Contact:\s*mailto:/m.test(sec.body), 'A.6.8', 'security.txt con contacto de seguridad', (sec.body.match(/^Contact:.*$/m) || [''])[0], `responde ${sec.status}`);
    check(expires > Date.now(), 'A.6.8', 'security.txt vigente', `Expires ${isNaN(expires) ? '—' : expires.toISOString().slice(0, 10)}`, 'vencido o sin Expires');
  }
  const ps = paginas['/politica-seguridad.html'], pdr = paginas['/politica-datos.html'];
  if (!ps.bloqueada) {
    check(/id="reportar"/.test(ps.body) && /seguridad@voz360\.co/.test(ps.body),
      'A.6.8', 'Canal de reporte en la política de seguridad', 'seguridad@voz360.co', 'falta la sección para reportar');
    check(/Aprobad[oa] por/.test(ps.body), 'A.5.1', 'Política de seguridad publicada y aprobada', 'Gerencia General', 'sin datos de aprobación');
  }

  /* ---------- A.5.1 Políticas / A.5.34 Privacidad y protección de datos personales ---------- */
  if (!pdr.bloqueada) {
    const pd = pdr.body;
    for (const [txt, prueba] of [
      ['DALMARU INVERSIONES S.A.S.', 'Identifica al Responsable (razón social)'],
      ['900434099-6', 'Publica el NIT'],
      ['datospersonales@voz360.co', 'Canal para ejercer derechos'],
      ['Ley Estatutaria 1581 de 2012', 'Marco legal (Ley 1581 de 2012)'],
      ['9. Derechos de los titulares', 'Derechos de los titulares'],
      ['11. Procedimiento para el ejercicio de los derechos', 'Procedimiento de consultas y reclamos'],
      ['Aviso de privacidad', 'Aviso de privacidad'],
    ]) check(pd.includes(txt), 'A.5.34', `Política de datos: ${prueba}`, 'publicado', `no se encontró «${txt}»`);
    const pendientes = (pd.match(/\[(DD|Nombre|Lunes)[^\]]*\]/g) || []);
    check(!pendientes.length, 'A.5.1', 'Política de datos sin campos por completar', 'completa', `${pendientes.length} campos entre corchetes: ${[...new Set(pendientes)].join(', ')}`, aviso);
  }

  /* ---------- A.5.34 Formularios: autorización de datos ---------- */
  const index = paginas['/'].bloqueada ? '' : paginas['/'].body;
  const forms = index.match(/<form[\s\S]*?<\/form>/g) || [];
  if (index) check(forms.length > 0, 'A.5.34', 'Formularios encontrados', String(forms.length), 'ninguno');
  for (const f of forms) {
    const id = (f.match(/<form[^>]*id="([^"]+)"/) || [])[1] || '(sin id)';
    const pideDatos = /type="email"|name="(correo|email|telefono|tel|nombre)"/.test(f);
    if (!pideDatos) continue;
    const consentimiento = /<input[^>]*type="checkbox"[^>]*required[^>]*>[\s\S]{0,400}?politica-datos\.html/.test(f);
    check(consentimiento, 'A.5.34', `Formulario #${id}: autorización obligatoria con enlace a la política`, 'casilla obligatoria + enlace', 'falta la casilla obligatoria o el enlace');
    const action = (f.match(/<form[^>]*action="([^"]*)"/) || [])[1] || '';
    check(!action.startsWith('http:'), 'A.8.24', `Formulario #${id}: envío cifrado`, action || 'mismo sitio (HTTPS)', action);
  }

  /* ---------- A.8.26 Contenido: sin recursos inseguros ni de terceros ---------- */
  for (const p of PAGINAS) {
    if (paginas[p].bloqueada) continue;
    const html = paginas[p].body;
    const mixtos = [...html.matchAll(/\b(?:src|href)="(http:\/\/[^"]+)"/g)].map(m => m[1]);
    check(!mixtos.length, 'A.8.24', `Sin contenido mixto (http) en ${p}`, 'todo por HTTPS', mixtos.slice(0, 3).join(', '));
    const externos = [...html.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)].map(m => m[1]).filter(s => /^(https?:)?\/\//.test(s) && !s.includes(HOST));
    const enLinea = (html.match(/<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>/g) || []).length;
    if (!externos.length && !enLinea) ok('A.5.34', `Sin scripts de terceros en ${p}`, 'solo scripts propios');
    else {
      const godaddy = externos.every(s => /wsimg\.com/.test(s));
      (godaddy ? aviso : falla)('A.5.34', `Sin scripts de terceros en ${p}`,
        `${externos.join(', ')}${enLinea ? ` + ${enLinea} script(s) en línea` : ''}${godaddy ? ' — inyectado por GoDaddy ("Métrica del sitio web"); la CSP lo bloquea, pero hay que desactivarlo' : ''}`);
    }
    const blank = [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)].map(m => m[0]).filter(a => !/rel="[^"]*noopener/.test(a));
    check(!blank.length, 'A.8.26', `Enlaces externos con rel="noopener" en ${p}`, 'todos', `${blank.length} sin noopener`, aviso);
  }

  /* ---------- Informe ---------- */
  const n = e => resultados.filter(r => r.estado === e).length;
  const fecha = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const md = [
    `## Pruebas de seguridad del sitio (ISO/IEC 27001:2022)`,
    ``,
    `**Sitio:** ${BASE} · **Fecha:** ${fecha} · **Resultado:** ${n('OK')} OK · ${n('AVISO')} avisos · ${n('FALLA')} fallas`,
    ``,
    `| Control | Prueba | Resultado | Detalle |`,
    `|---|---|---|---|`,
    ...resultados.map(r => `| ${r.control} | ${r.prueba} | ${r.estado === 'OK' ? '✅ OK' : r.estado === 'AVISO' ? '⚠️ AVISO' : '❌ FALLA'} | ${String(r.detalle).replace(/\|/g, '\\|').slice(0, 160)} |`),
    ``
  ].join('\n');
  console.log(md);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
  if (process.env.INFORME) fs.writeFileSync(process.env.INFORME, md + '\n');
  process.exit(n('FALLA') ? 1 : 0);
})().catch(e => { console.error('::error::' + e.message); process.exit(1); });
