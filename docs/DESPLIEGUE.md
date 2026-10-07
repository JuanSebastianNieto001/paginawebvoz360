# Despliegue (Vercel)

- **Repositorio:** GitHub `JuanSebastianNieto001/paginawebvoz360`, rama `main`.
- **Producción:** <https://paginawebvoz360.vercel.app>
- **Proyecto Vercel:** `paginawebvoz360`. Preset "Other", sin build. Publica la carpeta `public/`, definida en `vercel.json` (`outputDirectory`).

Cada push a `main` publica automáticamente. Cada push a otra rama genera una vista previa con su propia URL, protegida con el inicio de sesión de Vercel.

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
git add -A && git commit -m "Descripción del cambio"
git push origin main              # o la rama del cambio, para tener vista previa
```

Comprueba después que el despliegue quedó en estado **Ready**:

```bash
npx vercel ls paginawebvoz360
```

## Deploys antiguos

Por decisión del proyecto se conservan solo el deploy actual y el anterior. El anterior sirve para volver atrás de inmediato ("Promote to Production" en Vercel). Los demás se eliminan:

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

**Subir:** cPanel → Administrador de archivos → `public_html/` → borrar el contenido de ejemplo → *Cargar* `voz360-hosting.zip` → clic derecho → *Extraer* → borrar el `.zip`. Activar "Mostrar archivos ocultos" para ver `.htaccess`.

**DNS** (el dominio está en Google; se administra desde la Consola del administrador de Google → Dominios → Administrar dominios → configuración de DNS):

| Tipo | Nombre | Valor | Nota |
|---|---|---|---|
| A | `@` | IP compartida del hosting (cPanel → *Información general* → "Dirección IP compartida") | Reemplaza los registros A existentes de `@` |
| CNAME | `www` | `voz360.co.` | |

**No tocar** los registros MX, TXT (SPF, verificación de Google), ni los CNAME/TXT de DKIM (`google._domainkey`): son los del correo de Google Workspace. Si se borran, el correo deja de funcionar.

**HTTPS:** cuando el dominio ya apunte al hosting, activar el certificado en cPanel → *SSL/TLS Status* (AutoSSL). El `.htaccess` fuerza HTTPS, así que el sitio no abre bien hasta que el certificado esté activo (suele tardar de minutos a pocas horas).

**Comprobar:** `https://voz360.co` carga, `http://` y `www.` redirigen, `/.well-known/security.txt` responde, `/.htaccess` da 403 y securityheaders.com sigue en A+.

### Estado actual (7 oct 2026)

| Dato | Valor |
|---|---|
| Hosting | GoDaddy, plan Web Hosting Inicial (cPanel). Accesos: ver el registro interno de activos del SGSI |
| IP del hosting | `216.69.169.106`, carpeta `public_html` |
| Dominio | `voz360.co`, registrado con Google Workspace y administrado en **Squarespace Domains**. Accesos: ver el registro interno del SGSI |
| DNS de la web | A `@` → `216.69.169.106` · CNAME `www` → `voz360.co` |
| DNS del correo (no tocar) | MX `smtp.google.com` · TXT SPF `v=spf1 include:_spf.google.com ~all` · TXT `google._domainkey` (DKIM) |
| Certificado | Let's Encrypt para `voz360.co` y `www.voz360.co`. **Vence el 5 de enero de 2027** |

**Renovar el certificado antes del 5 de diciembre de 2026.** El plan no incluye AutoSSL ni SSL de GoDaddy. Hay dos opciones: comprar el SSL administrado de GoDaddy, que se renueva solo, o emitir de nuevo uno de Let's Encrypt (validación HTTP-01: publicar el reto en `public_html/.well-known/acme-challenge/` y luego instalarlo en cPanel → SSL/TLS → *Instalar*). No dejes la clave privada en `public_html`.

**Pendiente en GoDaddy:** desactivar *Configuración → Métrica del sitio web*. GoDaddy inyecta un script de analítica (`img1.wsimg.com/.../tccl.min.js`) en cada página. La CSP lo bloquea, pero contradice la política de datos ("sin analítica de terceros").

## Volver a una versión anterior

- **Rápido:** en Vercel → Deployments → el deploy anterior → *Promote to Production*.
- **Definitivo:** `git revert <commit>` y push a `main`.
