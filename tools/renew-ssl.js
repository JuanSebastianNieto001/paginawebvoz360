/* ==========================================================================
   RENOVACIÓN DEL CERTIFICADO TLS (Let's Encrypt) EN EL HOSTING DE GODADDY
   El plan de GoDaddy no incluye AutoSSL ni certificado, así que este script
   hace el trabajo. Lo ejecuta cada semana .github/workflows/ssl-renew.yml.

   1. Mira cuántos días le quedan al certificado que sirve https://DOMINIO.
   2. Si quedan más de RENOVAR_DIAS (y no se forzó), termina sin hacer nada.
   3. Pide un certificado nuevo a Let's Encrypt para el dominio y www, con
      validación HTTP-01: publica el reto en public_html/.well-known/acme-challenge
      usando la API de cPanel.
   4. Lo instala en cPanel (SSL/install_ssl), borra los retos y comprueba que
      el servidor ya entregue el certificado nuevo.
   Termina con error (GitHub avisa por correo) si algo falla o si al
   certificado le quedan menos de ALERTA_DIAS.

   Variables de entorno:
     CPANEL_HOST, CPANEL_USER, CPANEL_TOKEN  acceso a la API de cPanel (secretos)
     DOMINIO        por defecto voz360.co
     FORZAR=1       renovar aunque falten muchos días
     PRUEBA=1       usa el entorno de pruebas de Let's Encrypt y NO instala
                    (sirve para verificar que todo el circuito funciona)
   Uso local: cd tools && npm install && CPANEL_...=… node renew-ssl.js
   ========================================================================== */
'use strict';

const tls = require('tls');
const acme = require('acme-client');

const DOMINIO = process.env.DOMINIO || 'voz360.co';
const NOMBRES = [DOMINIO, 'www.' + DOMINIO];
const RENOVAR_DIAS = 30;   // renovar cuando queden menos de estos días
const ALERTA_DIAS = 20;    // fallar (y avisar) si después de todo quedan menos
const FORZAR = process.env.FORZAR === '1' || process.env.FORZAR === 'true';
const PRUEBA = process.env.PRUEBA === '1' || process.env.PRUEBA === 'true';

const { CPANEL_HOST, CPANEL_USER, CPANEL_TOKEN } = process.env;
const API = `https://${CPANEL_HOST}:2083`;
const AUTH = { Authorization: `cpanel ${CPANEL_USER}:${CPANEL_TOKEN}` };
const DOCROOT = `/home/${CPANEL_USER}/public_html`;
const RETOS = `${DOCROOT}/.well-known/acme-challenge`;

const espera = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(...a);

/* ---------- Certificado publicado ---------- */
function certificadoActual() {
  return new Promise((resolve, reject) => {
    const s = tls.connect({ host: DOMINIO, port: 443, servername: DOMINIO, timeout: 20000 }, () => {
      const c = s.getPeerCertificate();
      s.end();
      const vence = new Date(c.valid_to);
      resolve({ vence, dias: Math.floor((vence - Date.now()) / 864e5), emisor: c.issuer && (c.issuer.O || c.issuer.CN) });
    });
    s.on('error', reject);
    s.on('timeout', () => { s.destroy(); reject(new Error('Tiempo de espera agotado al conectar con ' + DOMINIO)); });
  });
}

/* ---------- API de cPanel ---------- */
async function uapi(modulo, funcion, campos) {
  const res = await fetch(`${API}/execute/${modulo}/${funcion}`, {
    method: 'POST', headers: AUTH, body: new URLSearchParams(campos)
  });
  const r = await res.json();
  if (!r.status) throw new Error(`cPanel ${modulo}/${funcion}: ${(r.errors || []).join(' ') || res.status}`);
  return r.data;
}
async function api2(funcion, campos) {
  const q = new URLSearchParams({ cpanel_jsonapi_apiversion: '2', cpanel_jsonapi_module: 'Fileman', cpanel_jsonapi_func: funcion, ...campos });
  const r = await (await fetch(`${API}/json-api/cpanel?${q}`, { headers: AUTH })).json();
  return r.cpanelresult || {};
}

/* ---------- Programa ---------- */
(async () => {
  if (!CPANEL_HOST || !CPANEL_USER || !CPANEL_TOKEN) throw new Error('Faltan CPANEL_HOST, CPANEL_USER o CPANEL_TOKEN');

  const antes = await certificadoActual();
  log(`Certificado actual de ${DOMINIO}: ${antes.emisor}, vence el ${antes.vence.toISOString().slice(0, 10)} (${antes.dias} días)`);
  if (antes.dias > RENOVAR_DIAS && !FORZAR && !PRUEBA) {
    log(`Faltan más de ${RENOVAR_DIAS} días: no hace falta renovar.`);
    return;
  }

  log(PRUEBA ? 'Modo PRUEBA: Let\'s Encrypt staging, sin instalar.' : 'Renovando…');
  const client = new acme.Client({
    directoryUrl: PRUEBA ? acme.directory.letsencrypt.staging : acme.directory.letsencrypt.production,
    accountKey: await acme.crypto.createPrivateKey()
  });
  await client.createAccount({ termsOfServiceAgreed: true });
  const order = await client.createOrder({ identifiers: NOMBRES.map(value => ({ type: 'dns', value })) });
  const autorizaciones = await client.getAuthorizations(order);

  // Retos HTTP-01 publicados en el hosting
  await api2('mkdir', { path: `${DOCROOT}/.well-known`, name: 'acme-challenge' });   // si ya existe no pasa nada
  const retos = [];
  for (const a of autorizaciones) {
    const ch = a.challenges.find(c => c.type === 'http-01');
    await uapi('Fileman', 'save_file_content', { dir: RETOS, file: ch.token, content: await client.getChallengeKeyAuthorization(ch) });
    retos.push({ dominio: a.identifier.value, ch });
  }
  try {
    for (const r of retos) {
      await client.completeChallenge(r.ch);
      await client.waitForValidStatus(r.ch);
      log('Validado', r.dominio);
    }
    const [clave, csr] = await acme.crypto.createCsr({ commonName: DOMINIO, altNames: NOMBRES });
    await client.finalizeOrder(order, csr);
    const pem = await client.getCertificate(order);
    const certs = pem.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g);

    if (PRUEBA) { log('Prueba correcta: Let\'s Encrypt emitió el certificado de prueba (no se instala).'); return; }

    const instalado = await uapi('SSL', 'install_ssl', { domain: DOMINIO, cert: certs[0], key: clave.toString(), cabundle: certs.slice(1).join('\n') });
    log('Instalado:', (instalado && instalado.message || '').split('\n')[0]);
  } finally {
    await api2('fileop', { op: 'unlink', sourcefiles: RETOS });   // limpia los retos aunque algo falle
  }

  // El servidor puede tardar unos segundos en recargar Apache
  let despues = antes;
  for (let i = 0; i < 12; i++) {
    await espera(10000);
    despues = await certificadoActual().catch(() => despues);
    if (despues.vence > antes.vence) break;
  }
  log(`Certificado publicado: ${despues.emisor}, vence el ${despues.vence.toISOString().slice(0, 10)} (${despues.dias} días)`);
  if (despues.dias < ALERTA_DIAS) throw new Error(`Al certificado le quedan ${despues.dias} días`);
})().catch(e => { console.error('::error::' + e.message); process.exit(1); });
