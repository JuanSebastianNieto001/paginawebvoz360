# Despliegue

- **Repositorio:** GitHub `JuanSebastianNieto001/paginawebvoz360`, rama `main`. Es **público**: aquí no se escriben cuentas, usuarios, servidores, IP ni tokens. Esos datos están en el registro interno de activos del SGSI, y los accesos que usan los flujos, en los secretos de GitHub.
- **Producción:** <https://voz360.co> (hosting de GoDaddy). Se publica sola en cada push a `main` (ver [Hosting de GoDaddy](#hosting-de-godaddy-dominio-voz360co)).
- **Copia en Vercel:** <https://paginawebvoz360.vercel.app>, también automática.
- **Proyecto Vercel:** `paginawebvoz360`. Preset "Other", sin build. Publica la carpeta `public/`, definida en `vercel.json` (`outputDirectory`).

Cada push a `main` publica automáticamente. Cada push a otra rama genera una vista previa en Vercel con su propia URL, protegida con el inicio de sesión de Vercel.

## `vercel.json`

| Clave | Para qué |
|---|---|
| `outputDirectory: "public"` | Solo se publica `public/`; `docs/`, `tools/` y la configuración nunca quedan expuestos |
| `headers` → `/(.*)` | Cabeceras de seguridad para todas las rutas (ver abajo) |
| `headers` → `/assets/(.*)` | Imágenes, fuentes, CSS y JS se guardan en el navegador por 1 año (`immutable`). Por eso los CSS y JS llevan `?v=` y las imágenes nuevas usan nombres nuevos |

### Cabeceras de seguridad

| Cabecera | Efecto |
|---|---|
| `Content-Security-Policy` | Solo se cargan recursos del propio sitio; sin scripts en línea; formularios solo hacia el sitio y Formspree; la página no puede incrustarse en otro sitio |
| `X-Frame-Options: DENY` | Refuerza la protección contra incrustación (clickjacking) |
| `X-Content-Type-Options: nosniff` | El navegador no "adivina" tipos de archivo |
| `Referrer-Policy` | No se envía la URL completa a otros sitios |
| `Permissions-Policy` | Cámara, micrófono, ubicación y pagos deshabilitados |
| `Cross-Origin-Opener-Policy` | Aísla la ventana de otras páginas |
| `Strict-Transport-Security` | Siempre HTTPS (2 años, con subdominios) |

## Publicar un cambio

```bash
node tools/bump-version.js        # si cambió CSS o JS
git status                        # revisar qué cambió
git add public/ docs/ tools/      # más la configuración que haya cambiado: vercel.json, .github/, .zap/, .gitignore
git commit -m "Descripción del cambio"
git push origin main              # o la rama del cambio, para tener vista previa
```

No uses `git add -A` ni `git add .`: solo se versionan `public/`, `docs/`, `tools/` y la configuración. Los documentos Word, PDF y demás material original nunca se suben (el `.gitignore` los excluye, pero revisa `git status` antes del commit).

Comprueba después que el deploy de Vercel quedó en estado **Ready** y que los flujos de GitHub Actions terminaron en verde:

```bash
npx vercel ls paginawebvoz360
gh run list --limit 5
```

## Flujos de GitHub Actions

| Flujo | Archivo | Qué hace | Cuándo corre | Evidencia |
|---|---|---|---|---|
| **Publicar en GoDaddy** | `deploy-godaddy.yml` | Arma el paquete, lo sube a `public_html` con la API de cPanel, lo descomprime y comprueba que voz360.co sirva la versión nueva con sus cabeceras | Push a `main` que cambie `public/`, `vercel.json`, `tools/build-hosting.js` o `.github/workflows/deploy-godaddy.yml`; también a mano | Registro de la ejecución en Actions; aviso por correo si falla |
| **Certificado TLS** | `ssl-renew.yml` | Revisa el certificado de voz360.co y, si le quedan menos de 30 días, lo renueva con Let's Encrypt y lo instala | Cada lunes, 8:00 a. m. (hora de Colombia); también a mano (`forzar`, `prueba`) | Registro de la ejecución; termina en rojo y avisa por correo si falla o si quedan menos de 20 días |
| **Pruebas ISO del sitio** | `iso-web-check.yml` | Ejecuta `tools/iso-web-check.js` contra voz360.co (cabeceras, HTTPS, certificado, archivos expuestos, etc.) | Después de cada publicación exitosa en GoDaddy, cada lunes a las 8:30 a. m. y a mano | Informe en el resumen de la ejecución y archivo descargable `informe-iso-web-<n>` (90 días); aviso por correo si hay una FALLA |
| **Escaneo de vulnerabilidades (OWASP ZAP)** | `zap-scan.yml` | Escaneo pasivo *baseline* de voz360.co; las reglas aceptadas están en `.zap/reglas.tsv` | Primer lunes de cada mes, 9:00 a. m., y a mano | Archivo descargable `informe-zap` (HTML, 90 días) |

Todos se ven en GitHub → **Actions** y se lanzan a mano con *Run workflow*. Los archivos descargables duran 90 días: para auditoría, descárgalos y guárdalos en el archivo documental del SGSI.

## Deploys antiguos (Vercel)

Por decisión del proyecto se conservan solo el deploy actual y el anterior de Vercel. Los demás se eliminan:

```bash
npx vercel rm <url-del-deploy> --yes
```

El historial completo sigue en Git, así que cualquier versión anterior se puede volver a publicar.

## Hosting de GoDaddy (dominio voz360.co)

El hosting de GoDaddy (cPanel) usa Apache, que **no lee `vercel.json`**. Las mismas cabeceras de seguridad, HTTPS obligatorio, redirección de `www` y caché van en un `.htaccess` que genera la herramienta:

```bash
node tools/build-hosting.js            # dominio por defecto: voz360.co
```

Genera `dist/hosting/` y `dist/voz360-hosting.zip` (no se versionan). El `.htaccess` y `security.txt` salen con el dominio definitivo.

### Publicación automática (GitHub Actions)

El flujo [`.github/workflows/deploy-godaddy.yml`](../.github/workflows/deploy-godaddy.yml) se ejecuta en cada push a `main` que cambie `public/`, `vercel.json`, `tools/build-hosting.js` o el propio `.github/workflows/deploy-godaddy.yml`. Arma el paquete, lo sube a `public_html` con la API de cPanel, lo descomprime y comprueba que `https://voz360.co` muestre la versión nueva con sus cabeceras de seguridad. Se ve en GitHub → **Actions**, y si falla GitHub avisa por correo. También se puede lanzar a mano: Actions → *Publicar en GoDaddy* → *Run workflow*.

Usa tres secretos cifrados del repositorio (Settings → Secrets and variables → Actions): `CPANEL_HOST`, `CPANEL_USER` y `CPANEL_TOKEN`. Sus valores solo están ahí y en el registro interno de activos del SGSI; nunca se escriben en el repositorio. El token se crea en cPanel → *Seguridad* → *Administrar tokens de API*. Si se revoca o vence, hay que crear otro y actualizar `CPANEL_TOKEN`.

Descomprimir sobrescribe los archivos, pero **no borra** los que se eliminaron del repositorio. Si se quita un archivo de `public/`, hay que borrarlo también en el Administrador de archivos de cPanel.

**Subida manual (si el flujo no está disponible):** cPanel → Administrador de archivos → `public_html/` → *Cargar* `voz360-hosting.zip` → clic derecho → *Extraer* → borrar el `.zip`. Activar "Mostrar archivos ocultos" para ver `.htaccess`.

**DNS** (se administra en el registrador del dominio; registrador, cuenta y accesos están en el registro interno de activos del SGSI):

| Tipo | Nombre | Valor | Nota |
|---|---|---|---|
| A | `@` | IP compartida del hosting (cPanel → *Información general* → "Dirección IP compartida"; también en el registro interno del SGSI) | Reemplaza los registros A existentes de `@` |
| CNAME | `www` | `voz360.co.` | |

**No tocar** los registros MX, TXT (SPF y verificación) ni los de DKIM: son los del correo corporativo. Si se borran, el correo deja de funcionar.

**HTTPS:** el certificado lo instala y renueva el flujo *Certificado TLS* (ver abajo). El `.htaccess` fuerza HTTPS, así que el sitio no abre bien sin un certificado válido.

**Comprobar:** `https://voz360.co` carga, `http://` y `www.` redirigen, `/.well-known/security.txt` responde, `/.htaccess` da 403 y securityheaders.com sigue en A+. Las *Pruebas ISO del sitio* lo revisan solas después de cada publicación.

### Estado actual (8 oct 2026)

| Dato | Valor |
|---|---|
| Hosting | GoDaddy, hosting compartido con cPanel, carpeta `public_html`. Plan, servidor, IP y accesos: ver el registro interno de activos del SGSI |
| Dominio | `voz360.co`. Registrador, cuenta y accesos: ver el registro interno de activos del SGSI |
| DNS de la web | A `@` → IP del hosting · CNAME `www` → `voz360.co` |
| DNS del correo (no tocar) | MX, SPF y DKIM del correo corporativo |
| Certificado TLS | Let's Encrypt para `voz360.co` y `www.voz360.co`, renovación automática semanal (ver abajo) |

**Certificado TLS (renovación automática).** El plan de hosting no incluye AutoSSL ni certificado. El flujo [`.github/workflows/ssl-renew.yml`](../.github/workflows/ssl-renew.yml) se ejecuta **cada lunes**: si al certificado le quedan menos de 30 días, `tools/renew-ssl.js` pide uno nuevo a Let's Encrypt (validación HTTP-01 publicada con la API de cPanel), lo instala y comprueba que el servidor ya lo entregue. Si falla, o si quedan menos de 20 días, el flujo termina en rojo y GitHub avisa por correo (Let's Encrypt ya no envía avisos de vencimiento). A mano: Actions → *Certificado TLS* → *Run workflow* (`forzar` renueva ya; `prueba` recorre todo el proceso con el entorno de pruebas de Let's Encrypt, sin instalar).

**Protocolos:** el servidor acepta solo TLS 1.2, con cifrado ECDHE + AES-GCM. TLS 1.0 y 1.1 están deshabilitados. TLS 1.3 no está disponible en el hosting compartido y no se puede activar desde cPanel.

**Pendiente en GoDaddy:** desactivar *Configuración → Métrica del sitio web*. GoDaddy inyecta un script de analítica (`img1.wsimg.com/.../tccl.min.js`) en cada página. La CSP lo bloquea, pero contradice la política de datos ("sin analítica de terceros").

## Volver a una versión anterior

- **voz360.co (GoDaddy, producción):** `git revert <commit>` y push a `main`; el flujo *Publicar en GoDaddy* vuelve a publicar. GoDaddy no guarda versiones anteriores, así que esta es la única vía. Si el revert quita archivos de `public/`, bórralos también a mano en cPanel (descomprimir no borra).
- **Copia de Vercel:** Vercel → Deployments → el deploy anterior → *Promote to Production*. Es inmediato, pero **solo afecta a paginawebvoz360.vercel.app**, no a voz360.co. El `git revert` también actualiza Vercel.
