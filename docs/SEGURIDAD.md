# Seguridad de la información (ISO/IEC 27001:2022)

El sitio web forma parte del alcance del SGSI de VOZ360. Este documento resume los controles del Anexo A que aplican a la web y cómo se cumplen. **No incluir aquí información sensible**: el repositorio es público.

## Controles implementados

| Control | Cómo se cumple en el sitio |
|---|---|
| A.5.1 · Cláusula 5.2 Políticas | `politica-seguridad.html`, enlazada desde el footer |
| A.5.34 Privacidad y datos personales | `politica-datos.html`: Política de tratamiento de la información y protección de datos personales de DALMARU INVERSIONES S.A.S. – VOZ360, publicada tal cual del documento Word (Ley 1581 de 2012, Decreto 1074 de 2015), con aviso de privacidad y formatos de autorización y de reclamo. Casilla obligatoria de autorización en los tres formularios (contacto, empleo y PQRS). Sin cookies, píxeles ni analítica de terceros |
| A.5.24–A.5.26 Incidentes | Enlace "Reportar un incidente" en el footer y `/.well-known/security.txt` (RFC 9116) |
| A.5.31 Requisitos legales | NIT y domicilio publicados; sin afirmaciones de seguridad no demostrables |
| A.7.7 Pantalla y escritorio limpios | Protocolo de revisión de fotos ([CONTENIDO.md](CONTENIDO.md#fotos)) y herramienta de desenfoque (`tools/blur-regions.js`). Fotos publicadas sin metadatos |
| A.8.9 Configuración · A.8.26 Seguridad de aplicaciones | Cabeceras de seguridad en `vercel.json` (CSP estricta sin scripts en línea, anti-clickjacking, HSTS, etc.). Ver [DESPLIEGUE.md](DESPLIEGUE.md) |
| A.8.24 Criptografía | Solo HTTPS, con HSTS de 2 años |
| A.8.4 Acceso al código · A.5.12 Clasificación | Solo se publica `public/`; el material original está excluido por `.gitignore` |
| A.8.25–A.8.29 Desarrollo seguro y pruebas | Convenciones y flujo con vista previa en [DESARROLLO.md](DESARROLLO.md); servidor local con las mismas cabeceras que producción |
| A.8.8 Vulnerabilidades · A.8.29 Pruebas de seguridad | Pruebas automáticas del sitio publicado (`tools/iso-web-check.js`): después de cada publicación y cada lunes. Ver [Pruebas de seguridad](#pruebas-de-seguridad-del-sitio) |
| A.8.32 Gestión de cambios | Historial de Git con mensajes descriptivos; vista previa y aprobación antes de producción; deploy anterior disponible para volver atrás |

## Pendientes (responsabilidad de VOZ360)

- [ ] **Repositorio de GitHub privado**, o historial depurado. El historial contiene versiones antiguas de fotos que no deben ser públicas (ver el reporte interno de riesgos en fotos, que está fuera de este repositorio).
- [ ] Cuentas de GitHub y Vercel **corporativas**, con verificación en dos pasos y registro de accesos (A.5.18, A.8.2).
- [ ] Crear los buzones `seguridad@voz360.co` y `datospersonales@voz360.co`, o cambiarlos en la web.
- [x] Política de seguridad de la información aprobada por la Gerencia General (DALMARU INVERSIONES S.A.S., v1.0, 02/06/2026) y publicada textualmente en `politica-seguridad.html`.
- [ ] **Aprobación de la política de tratamiento de datos** por la Gerencia y revisión jurídica. Ya está publicada; faltan por completar en el documento: fechas de adopción y vigencia, nombre del representante legal, responsable designado de protección de datos y horario de atención. Confirmar con contabilidad si la empresa supera 100.000 UVT en activos (obligación de inscribir las bases de datos en el RNBD, sección 15).
- [ ] Desactivar en GoDaddy *Configuración → Métrica del sitio web*: inyecta un script de analítica en cada página (la CSP lo bloquea, pero contradice la sección 17 de la política de datos).
- [ ] **Autorizaciones de uso de imagen** de todas las personas que aparecen en fotos y reels. Autorización de los clientes cuya marca aparezca.
- [ ] Registrar como proveedores en el SGSI: Vercel, GitHub, el proveedor de formularios y las herramientas de IA usadas en el desarrollo (A.5.19–A.5.23).
- [ ] Procedimiento de **uso de IA en el desarrollo**, aprobado por la Dirección (A.5.10, A.8.30).
- [ ] Monitoreo de disponibilidad del sitio con alertas (A.8.16).
- [ ] Dominio corporativo (p. ej. `www.voz360.co`). Al tenerlo, actualizar `Canonical` y `Policy` en `security.txt`.
- [ ] Al conectar los formularios: proveedor con acuerdo de tratamiento de datos, acceso restringido a las respuestas y plazos de conservación (12 meses para aspirantes no seleccionados).

## Pruebas de seguridad del sitio

`tools/iso-web-check.js` revisa el sitio publicado y relaciona cada prueba con su control del Anexo A:

| Control | Qué se prueba |
|---|---|
| A.8.24 Criptografía | TLS 1.2 activo; TLS 1.0 y 1.1 rechazados; certificado válido, de confianza y con más de 20 días de vigencia; HSTS de al menos 1 año; formularios y recursos solo por HTTPS |
| A.8.21 Seguridad de servicios de red | HTTP y `www` redirigen a `https://voz360.co` |
| A.8.9 · A.8.26 Configuración y seguridad de aplicaciones | CSP estricta (sin scripts en línea ni incrustación), X-Frame-Options, nosniff, Cross-Origin-Opener-Policy, servidor sin versión expuesta, enlaces externos con `noopener` |
| A.8.12 Fuga de datos | `.htaccess`, `.git`, `.env`, `docs/`, `tools/`, `vercel.json` y el paquete de publicación no son accesibles; sin listado de carpetas |
| A.5.34 Privacidad | Sin cookies ni scripts de terceros; Referrer-Policy y Permissions-Policy; política de datos con responsable, NIT, canal, derechos, procedimiento y aviso de privacidad; casilla obligatoria de autorización con enlace a la política en cada formulario |
| A.5.1 Políticas | Política de seguridad publicada con su aprobación; política de datos sin campos por completar |
| A.5.24–A.6.8 Reporte de eventos | `security.txt` vigente con contacto y sección para reportar en la política de seguridad |

Se ejecuta en GitHub (Actions → *Pruebas ISO del sitio*) después de cada publicación, cada lunes y a mano. El informe con fecha queda en el resumen de la ejecución y como archivo descargable durante 90 días: es la **evidencia** para la auditoría. Resultados: **OK**, **AVISO** (no bloquea, pero se debe atender) y **FALLA** (GitHub avisa por correo).

A mano: `node tools/iso-web-check.js`. El hosting tiene una protección anti-bots que, ante muchas peticiones seguidas desde una misma IP, responde con una página de verificación; por eso las pruebas van espaciadas y, si la verificación persiste, la prueba queda como AVISO "no se pudo comprobar" en lugar de un resultado falso.

## Si se detecta un problema

1. Retirar de inmediato el contenido afectado (commit + push; verificar el deploy).
2. Si hay datos personales expuestos: informar al responsable del SGSI y al área jurídica, que evalúan el reporte a la SIC (15 días hábiles) y el aviso al cliente afectado.
3. Registrar el incidente en el SGSI con la evidencia, las acciones y las lecciones aprendidas.
