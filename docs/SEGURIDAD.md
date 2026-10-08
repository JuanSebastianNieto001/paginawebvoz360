# Seguridad de la información (ISO/IEC 27001:2022)

El sitio web forma parte del alcance del SGSI de VOZ360. Este documento resume los controles del Anexo A que aplican a la web y cómo se cumplen. **No incluir aquí información sensible**: el repositorio es público.

## Controles implementados

| Control | Cómo se cumple en el sitio |
|---|---|
| A.5.1 · Cláusula 5.2 Políticas | `politica-seguridad.html`, enlazada desde el footer |
| A.5.34 Privacidad y datos personales | `politica-datos.html`: Política de tratamiento de la información y protección de datos personales de DALMARU INVERSIONES S.A.S. – VOZ360, publicada tal cual del documento Word (Ley 1581 de 2012, Decreto 1074 de 2015), con aviso de privacidad y formatos de autorización y de reclamo. Casilla obligatoria de autorización en los tres formularios (contacto, empleo y PQRS). Sin cookies, píxeles ni analítica de terceros |
| A.5.24–A.5.26 Incidentes | Enlace "Reportar un incidente" en el footer y `/.well-known/security.txt` (RFC 9116), publicado en `https://voz360.co` con `Canonical` y `Policy` apuntando a ese dominio (los ajusta `tools/build-hosting.js`) |
| A.5.31 Requisitos legales | NIT y domicilio publicados; sin afirmaciones de seguridad no demostrables |
| A.7.7 Pantalla y escritorio limpios | Protocolo de revisión de fotos ([CONTENIDO.md](CONTENIDO.md#fotos)) y herramienta de desenfoque (`tools/blur-regions.js`). Fotos publicadas sin metadatos |
| A.8.9 Configuración · A.8.26 Seguridad de aplicaciones | Cabeceras de seguridad definidas en `vercel.json` y generadas como `.htaccess` para GoDaddy por `tools/build-hosting.js`: CSP estricta sin scripts en línea, anti-clickjacking, nosniff, Cross-Origin-Opener-Policy, Cross-Origin-Embedder-Policy (`require-corp`), Cross-Origin-Resource-Policy (`same-origin`), HSTS, etc. Ver [DESPLIEGUE.md](DESPLIEGUE.md) |
| A.8.24 Criptografía | Solo HTTPS, con HSTS. En producción (GoDaddy): `max-age` de 1 año, sin `includeSubDomains` ni `preload` (ver decisión abajo). En Vercel: 2 años con `includeSubDomains` y `preload` |
| A.8.4 Acceso al código · A.5.12 Clasificación | Solo se publica `public/`; el material original está excluido por `.gitignore` |
| A.8.25–A.8.29 Desarrollo seguro y pruebas | Convenciones y flujo con vista previa en [DESARROLLO.md](DESARROLLO.md); servidor local con las mismas cabeceras que producción |
| A.8.8 Vulnerabilidades · A.8.29 Pruebas de seguridad | Pruebas automáticas del sitio publicado (`tools/iso-web-check.js`): después de cada publicación y cada lunes. Escaneo OWASP ZAP mensual. Ver [Pruebas de seguridad](#pruebas-de-seguridad-del-sitio) |
| A.8.32 Gestión de cambios | Historial de Git con mensajes descriptivos y versión anterior disponible para volver atrás. **Hoy no hay aprobación obligatoria antes de producción**: cada push a `main` publica el sitio (ver pendientes) |

**Decisión sobre HSTS (A.8.24).** En producción la cabecera es `max-age=31536000` (1 año), solo por HTTPS, sin `includeSubDomains` ni `preload`. El dominio tiene otros servicios en subdominios (correo de Google) que no deben quedar obligados a HTTPS desde el sitio, y la inclusión en la lista de precarga de los navegadores es difícil de revertir. Un año cumple el mínimo que exigen las pruebas y los escaneos externos. Se revisará si todos los subdominios quedan solo con HTTPS.

## Pendientes (responsabilidad de VOZ360)

**Acceso y control de cambios**

- [ ] **Repositorio de GitHub privado**, o historial depurado. El historial contiene versiones antiguas de fotos que no deben ser públicas (ver el reporte interno de riesgos en fotos, que está fuera de este repositorio).
- [ ] Cuentas de GitHub (y de Vercel, si sigue en uso) **corporativas**, con verificación en dos pasos y registro de accesos (A.5.18, A.8.2).
- [ ] **Protección de la rama `main`** o reglas de aprobación del entorno `produccion` en GitHub, para que ningún cambio llegue a producción sin revisión y quede evidencia del control de cambios (A.8.32).
- [ ] Fijar las acciones de terceros de GitHub Actions por hash de commit en lugar de por versión (A.8.32, A.5.21; menor).
- [ ] Aclarar si **Vercel sigue en uso**. Si no, retirar el proyecto y las cuentas; si sí, mantenerlo en el registro de proveedores.

**Políticas, datos personales y formularios**

- [x] Política de seguridad de la información aprobada por la Gerencia General (DALMARU INVERSIONES S.A.S., v1.0, 02/06/2026) y publicada textualmente en `politica-seguridad.html`.
- [ ] **Aprobación de la política de tratamiento de datos** por la Gerencia y revisión jurídica. Ya está publicada; faltan por completar en el documento: fechas de adopción y vigencia, nombre del representante legal, responsable designado de protección de datos y horario de atención. Confirmar con contabilidad si la empresa supera 100.000 UVT en activos (obligación de inscribir las bases de datos en el RNBD, sección 15).
- [ ] **Conectar los formularios** (hoy no envían nada) y crear los buzones `seguridad@voz360.co` y `datospersonales@voz360.co`, o cambiarlos en la web. Al conectarlos: proveedor con acuerdo de tratamiento de datos, acceso restringido a las respuestas y plazos de conservación (12 meses para aspirantes no seleccionados).
- [ ] La CSP permite `formspree.io` (`connect-src` y `form-action`) aunque no hay formularios conectados: confirmar que es el proveedor previsto o quitarlo de la CSP.
- [ ] Decidir si `seleccion@voz360.co` es canal oficial para hojas de vida y cómo se deja **prueba de la autorización de tratamiento** de las que llegan por correo.
- [ ] **Edad mínima** en el formulario de empleo (declaración de mayoría de edad o tratamiento de datos de menores).
- [ ] Desactivar en GoDaddy *Configuración → Métrica del sitio web*: inyecta un script de analítica en cada página. La CSP lo bloquea, pero contradice la sección 17 de la política de datos y es la causa de los avisos que quedan en ZAP, Observatory y las pruebas ISO.
- [ ] **Autorizaciones de uso de imagen** de todas las personas que aparecen en fotos y reels. Autorización de los clientes cuya marca aparezca.

**SGSI y evidencias**

- [ ] Que la Dirección **firme los riesgos aceptados** (ver abajo) en el registro de riesgos del SGSI.
- [ ] **Archivar periódicamente en el SGSI** los informes de las pruebas ISO y de ZAP (GitHub los guarda solo 90 días) y las capturas de Observatory, SSL Labs y securityheaders.com.
- [ ] Registrar como proveedores en el SGSI: GoDaddy, GitHub, Vercel (si sigue en uso), el proveedor de formularios y las herramientas de IA usadas en el desarrollo (A.5.19–A.5.23).
- [ ] Procedimiento de **uso de IA en el desarrollo**, aprobado por la Dirección (A.5.10, A.8.30).
- [ ] Monitoreo de disponibilidad del sitio con alertas (A.8.16).

**Resueltos**

- [x] Dominio corporativo: el sitio está en `https://voz360.co` y `security.txt` publicado allí apunta a ese dominio (`tools/build-hosting.js`).

## Pruebas de seguridad del sitio

`tools/iso-web-check.js` revisa el sitio publicado y relaciona cada prueba con su control del Anexo A:

| Control | Qué se prueba |
|---|---|
| A.8.24 Criptografía | TLS 1.2 activo; TLS 1.0 y 1.1 rechazados; certificado válido, de confianza y con más de 20 días de vigencia; HSTS de al menos 1 año; formularios y recursos solo por HTTPS |
| A.8.21 Seguridad de servicios de red | HTTP y `www` redirigen a `https://voz360.co` |
| A.8.9 · A.8.26 Configuración y seguridad de aplicaciones | CSP estricta (sin scripts en línea ni incrustación), X-Frame-Options, nosniff, Cross-Origin-Opener-Policy, Cross-Origin-Embedder-Policy, Cross-Origin-Resource-Policy, servidor sin versión expuesta, enlaces externos con `noopener` |
| A.8.12 Fuga de datos | `.htaccess`, `.git`, `.env`, `docs/`, `tools/`, `vercel.json` y el paquete de publicación no son accesibles; sin listado de carpetas |
| A.5.34 Privacidad | Sin cookies ni scripts de terceros; Referrer-Policy y Permissions-Policy; política de datos con responsable, NIT, canal, derechos, procedimiento y aviso de privacidad; casilla obligatoria de autorización con enlace a la política en cada formulario |
| A.5.1 Políticas | Política de seguridad publicada con su aprobación; política de datos sin campos por completar |
| A.5.24–A.6.8 Reporte de eventos | `security.txt` vigente con contacto y sección para reportar en la política de seguridad |

Se ejecuta en GitHub (Actions → *Pruebas ISO del sitio*) después de cada publicación, cada lunes y a mano. El informe con fecha queda en el resumen de la ejecución y como archivo descargable durante 90 días: es la **evidencia** para la auditoría (archivarla en el SGSI antes de que venza). Resultados: **OK**, **AVISO** (no bloquea, pero se debe atender) y **FALLA** (GitHub avisa por correo).

A mano: `node tools/iso-web-check.js`. El hosting tiene una protección anti-bots que, ante muchas peticiones seguidas desde una misma IP, responde con una página de verificación; por eso las pruebas van espaciadas y, si la verificación persiste, la prueba queda como AVISO "no se pudo comprobar" en lugar de un resultado falso.

## Escaneos externos (evidencia para auditoría)

Herramientas reconocidas e independientes, ejecutadas sobre `https://voz360.co`:

| Herramienta | Qué evalúa | Resultado (8 oct 2026) | Cómo repetirlo |
|---|---|---|---|
| OWASP ZAP (baseline, pasivo) | Vulnerabilidades web conocidas y configuración insegura | 65 pruebas superadas, 0 fallas, 2 avisos (script de GoDaddy) | Actions → *Escaneo de vulnerabilidades (OWASP ZAP)*; automático el primer lunes de cada mes. Informe HTML descargable |
| Mozilla HTTP Observatory | Cabeceras y políticas de seguridad | A+ (135/100), 11 de 12 pruebas (falla SRI por el script de GoDaddy) | developer.mozilla.org/observatory |
| securityheaders.com | Cabeceras de seguridad | A+ | securityheaders.com |
| Qualys SSL Labs | Configuración TLS y certificado | A- | ssllabs.com/ssltest |
| `tools/iso-web-check.js` | Pruebas por control del Anexo A | 70 OK, 6 avisos, 0 fallas | Ver arriba |

Avisos de las pruebas ISO: el script de métrica de GoDaddy (pendiente de desactivar), los campos por completar de la política de datos, TLS 1.3 no disponible en el hosting compartido (riesgo aceptado abajo) y una ruta que no se pudo comprobar porque respondió la protección anti-bots (no es una falla del sitio).

**Riesgos aceptados** (justificación para el auditor; pendiente la firma de la Dirección en el registro de riesgos):

- **SSL Labs A- y no A+.** El servidor compartido de GoDaddy solo ofrece TLS 1.2 (sin TLS 1.3) y mantiene cifrados antiguos (CBC y sin *forward secrecy*). Ambos dependen de la configuración de Apache del proveedor y no se pueden cambiar desde cPanel. TLS 1.0 y 1.1 están deshabilitados y el cifrado preferido es ECDHE + AES-GCM. Para llegar a A+ habría que poner un proxy (p. ej. Cloudflare) delante del hosting o cambiar a un plan con configuración propia.
- **`style-src 'unsafe-inline'` en la CSP.** Lo requieren unos 110 estilos decorativos de las animaciones, escritos como atributos. El riesgo es bajo: `script-src 'self'` impide ejecutar código inyectado, el sitio no muestra contenido enviado por usuarios y no se usa `innerHTML` con datos externos.
- **HSTS de 1 año sin `includeSubDomains` ni `preload`** en producción. Ver la decisión en [Controles implementados](#controles-implementados).
- **Recursos estáticos en caché** (CSS, JS, imágenes): es intencional; las páginas HTML y `security.txt` se sirven sin caché.

## Si se detecta un problema

1. Retirar de inmediato el contenido afectado (commit + push; verificar el deploy).
2. Si hay datos personales expuestos: informar al responsable del SGSI y al área jurídica, que evalúan el reporte a la SIC (15 días hábiles) y el aviso al cliente afectado.
3. Registrar el incidente en el SGSI con la evidencia, las acciones y las lecciones aprendidas.
